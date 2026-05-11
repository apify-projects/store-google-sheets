const { log, Actor } = require('apify');

const { sortPropertyNames } = require('./tabulation');

// We need to parse range to chunk large uploads
exports.parseRange = ({ range, firstSheetName }) => {
    const spreadsheetRange = range || firstSheetName;

    // Helper to parse an optional "Sheet!" prefix
    const sheetSplit = spreadsheetRange.match(/^([^!]+)!(.+)$/);
    const sheetName = sheetSplit ? sheetSplit[1] : null;
    const ref = sheetSplit ? sheetSplit[2] : spreadsheetRange;

    // A1:B2 — cell range
    const cellRangeMatch = ref.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
    if (cellRangeMatch) {
        return {
            ...(sheetName && { sheetName }),
            startColumn: cellRangeMatch[1],
            startRow: Number(cellRangeMatch[2]),
            endColumn: cellRangeMatch[3],
            endRow: Number(cellRangeMatch[4]),
        };
    }

    // A:B — full columns
    const colRangeMatch = ref.match(/^([A-Z]+):([A-Z]+)$/);
    if (colRangeMatch) {
        return {
            ...(sheetName && { sheetName }),
            startColumn: colRangeMatch[1],
            endColumn: colRangeMatch[2],
        };
    }

    // 1:5 — full rows
    const rowRangeMatch = ref.match(/^(\d+):(\d+)$/);
    if (rowRangeMatch) {
        return {
            ...(sheetName && { sheetName }),
            startRow: Number(rowRangeMatch[1]),
            endRow: Number(rowRangeMatch[2]),
        };
    }

    // A1 — single cell
    const cellMatch = ref.match(/^([A-Z]+)(\d+)$/);
    if (cellMatch) {
        return {
            ...(sheetName && { sheetName }),
            startColumn: cellMatch[1],
            startRow: Number(cellMatch[2]),
        };
    }

    // Sheet name only (no "!" present)
    if (!sheetSplit && !spreadsheetRange.includes('!')) {
        return {
            sheetName: spreadsheetRange,
            startColumn: 'A',
            startRow: 1,
        };
    }

    return null;
}

const ERRORS_TO_RETRY = [
    'The service is currently unavailable',
]

const getNiceErrorMessage = (type, errorMessage) => {
    const baseErrorMessage = `Request ${type} failed with error ${errorMessage}`;
    const wrongAccountText = `Perhaps you used a wrong Google account?\n`
        + `If you want to use a different Google account or use multiple Google accounts, please follow the guide here:\n`
        + `https://apify.com/lukaskrivka/google-sheets#authentication-and-authorization\n`
    if (errorMessage.includes('invalid_grant')) {
        return `${baseErrorMessage}\n${wrongAccountText}`;
    } else if (errorMessage.includes('The caller does not have permission')) {
        return `${baseErrorMessage}\n${wrongAccountText}`;
    } else {
        return baseErrorMessage;
    }
}

exports.retryingRequest = async (type, request) => {
    const MAX_ATTEMPTS = 6;
    const SLEEP_MULTIPLIER = 3;
    let sleepMs = 1000;

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        let response;
        try {
            response = await request();
            return response;
        } catch (e) {
            const willRetry = ERRORS_TO_RETRY.some((errorMessage) => e.message.includes(errorMessage));
            if (willRetry) {
                log.warning(`Retrying API call for ${type} to google with attempt n. ${i + 1} for error: ${e.message}`);
                await new Promise((res) => setTimeout(res, sleepMs));
                sleepMs *= SLEEP_MULTIPLIER;
            } else {
                log.error(getNiceErrorMessage(type, e.message));
                throw e;
            }
        }
    }
};

exports.countCells = (rows) => {
    if (!rows) return 0;
    if (!rows[0]) return 0;
    return rows[0].length * rows.length;
};

exports.trimSheetRequest = (height, width, sheetId) => {
    const payload = {
        requests: [],
    };
    if (height) {
        payload.requests.push({
            deleteDimension: {
                range: {
                    sheetId,
                    dimension: 'ROWS',
                    startIndex: height,
                },
            },
        });
    }
    if (width) {
        payload.requests.push({
            deleteDimension: {
                range: {
                    sheetId,
                    dimension: 'COLUMNS',
                    startIndex: width,
                },
            },
        });
    }
    return payload;
};

module.exports.createSheetRequest = (title) => {
    return {
        requests: [{
            addSheet: {
                properties: { title },
            },
        }],
    };
};

module.exports.saveBackup = async (createBackup, values) => {
    if (createBackup) {
        if (values) {
            log.info('Saving backup...');
            await Actor.setValue('backup', values);
        } else {
            log.warning('There are currently no rows in the spreadsheet so we will not save backup...');
        }
    }
};

module.exports.evalFunction = (transformFunction) => {
    let parsedTransformFunction;
    if (transformFunction) {
        try {
            // Safe eval stopped working with commented code
            parsedTransformFunction = eval(transformFunction); // eslint-disable-line
        } catch (e) {
            throw new Error('Evaluation of the tranform function failed with error. Please check if you inserted valid javascript code:', e);
        }
        // Undefined is allowed because I wanted to allow have commented code in the transform function
        if (typeof parsedTransformFunction !== 'function' && parsedTransformFunction !== undefined) {
            throw new Error('Transform function has to be a javascript function or it has to be undefined (in case the whole code is commented out)');
        }
        return parsedTransformFunction;
    }
};

// I know this is very inneficient way but so far didn't hit a performance bottleneck (on 3M items)
module.exports.sortObj = (obj, keys) => {
    const newObj = {};
    // First we add user-requested sorting
    for (const key of keys) {
        newObj[key] = obj[key];
    }
    // The we sort the rest with special algorithm
    // They are really only sorted mutably
    const sortedKeys = Object.keys(obj);
    sortPropertyNames(sortedKeys);

    for (const key of sortedKeys) {
        if (!keys.includes(key)) {
            newObj[key] = obj[key];
        }
    }
    return newObj;
};
