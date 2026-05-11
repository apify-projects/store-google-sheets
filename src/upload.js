const { Actor } = require('apify');

const { countCells, trimSheetRequest, retryingRequest, parseRange } = require('./utils');

module.exports = async ({ maxCells, rowsToInsert, spreadsheetId, spreadsheetRangeObj, values, client, targetSheetId }) => {
    // ensuring max cells limit
    const cellsToInsert = countCells(rowsToInsert);
    console.log(`Total rows: ${rowsToInsert.length}, total columns: ${rowsToInsert[0].length} total cells: ${cellsToInsert}`);
    if (cellsToInsert > maxCells) {
        await Actor.fail(`You reached the max limit of ${maxCells} cells. Try inserting less rows.`);
    }

    // Even if we are under cell limit, large requests can get rejected
    const ROW_CHUNK_SIZE = 5000;

    if (rowsToInsert.length < ROW_CHUNK_SIZE) {
        // Standard request, we take raw range because we can support all formats
        // We do this separately so if we introduce chunking bug, it happens only to very large payloads that are rare
        console.log('Inserting new cells');
        await retryingRequest('Inserting new rows', async () => client.spreadsheets.values.update({
            spreadsheetId,
            range: spreadsheetRangeObj.range || spreadsheetRangeObj.firstSheetName,
            valueInputOption: 'USER_ENTERED',
            resource: { values: rowsToInsert },
        }));
        console.log('Items inserted...');
    } else {
        // Chunking request, we need to parse range to get sheet name and starting row and column
        console.log('Inserting new cells in chunks');
        const parsedRange = parseRange(spreadsheetRangeObj);
        if (!parsedRange) {
            throw new Error('Cannot parse range for large upload. Range must be in A1 notation and contain sheet name. Example: "Sheet1!A1"');
        }
        const { sheetName, startRow = 1, startColumn = 'A' } = parsedRange;
        for (let i = 0; i < rowsToInsert.length; i += ROW_CHUNK_SIZE) {
            const chunk = rowsToInsert.slice(i, i + ROW_CHUNK_SIZE);

            // No sheet name is also valid
            const chunkRange = sheetName ? `${sheetName}!${startColumn}${startRow + i}` : `${startColumn}${startRow + i}`;
            console.log(`Inserting chunk of rows ${i} to ${i + chunk.length} at range ${chunkRange}`);
            await retryingRequest('Inserting new rows in chunks', async () => client.spreadsheets.values.update({
                spreadsheetId,
                range: chunkRange,
                valueInputOption: 'USER_ENTERED',
                resource: { values: chunk },
            }));
        }
        console.log('Items inserted in chunks...');
    }

    // trimming cells
    console.log('Maybe deleting unused cells');
    const height = values && values.length > rowsToInsert.length
        ? rowsToInsert.length
        : null;
    const maxInSheetWidth = values ? values.reduce((max, row) => Math.max(max, row.length), 0) : 0;
    const maxInsertWidth = rowsToInsert.reduce((max, row) => Math.max(max, row.length), 0);
    const width = maxInSheetWidth > maxInsertWidth
        ? maxInsertWidth
        : null;
    if (height || width) {
        if (height) console.log('Will delete unused rows');
        if (width) console.log('Will delete unused columns');
        await retryingRequest('Trimming excessive cells', async () => client.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: trimSheetRequest(height, width, targetSheetId),
        }));
    } else {
        console.log('No need to delete any rows or columns');
    }
};
