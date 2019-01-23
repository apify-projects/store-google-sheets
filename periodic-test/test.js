const Apify = require('apify');
const assert = require('assert');

const { mock1, mock2, mockTransform, backupMock } = require('./mock-data.js');

const NAME = 'lukaskrivka/google-spreadsheet-dev';
const spreadsheetId = '1jCmoAhhhHKAo5Ost3DzI4D9GgJ8VgwNBOeQk6qfXqgs';
const datasetIdOne = 'jbQP82GcRxBSQawPt';
const datasetIdTwo = 'jwxFQxAxARuMY8BCg';

Apify.main(async () => {
    // TEST 1
    console.log('TEST-1');
    // REPLACE
    console.log('calling - replace');
    await Apify.call(
        NAME,
        {
            datasetOrExecutionId: datasetIdOne,
            spreadsheetId,
            mode: 'replace',
        },
    );
    console.log('done - replace');

    // REPLACE - READ
    console.log('calling - read');
    const read1 = await Apify.call(
        NAME,
        {
            spreadsheetId,
            mode: 'read',
        },
    ).then(((res) => res.output.body));
    console.log('done - read');

    console.log('trying assertion');
    assert.deepEqual(read1, mock1);
    console.log('assertion done');

    // TEST 2
    console.log('TEST-2');
    // APPEND
    console.log('calling append');
    await Apify.call(
        NAME,
        {
            datasetOrExecutionId: datasetIdTwo,
            spreadsheetId,
            mode: 'append',
        },
    );
    console.log('done - append');

    // APPEND - READ
    console.log('calling - read');
    const read2 = await Apify.call(
        NAME,
        {
            spreadsheetId,
            mode: 'read',
        },
    ).then(((res) => res.output.body));
    console.log('done - read');

    console.log('trying assertion');
    assert.deepEqual(read2, mock1.concat(mock2));
    console.log('assertion done');

    // TEST 3
    console.log('TEST 3');

    // MODIFY
    console.log('calling modify');
    await Apify.call(
        NAME,
        {
            spreadsheetId,
            mode: 'modify',
            transformFunction: mockTransform.toString(),
        },
    );
    console.log('done - modify');

    // MODIFY - READ
    console.log('calling - read');
    const read3 = await Apify.call(
        NAME,
        {
            spreadsheetId,
            mode: 'read',
        },
    ).then(((res) => res.output.body));
    console.log('done - read');

    console.log('trying assertion');
    assert.deepEqual(read3, mock1.concat(mock2).slice(1));
    console.log('assertion done');

    // TEST 4
    console.log('TEST-4');

    // APPEND
    console.log('calling - append');
    const runInfo = await Apify.call(
        NAME,
        {
            datasetOrExecutionId: datasetIdOne,
            spreadsheetId,
            mode: 'append',
            createBackup: true,
            deduplicateByField: 'name',
        },
    );
    const { defaultKeyValueStoreId } = runInfo;
    console.log('done - append');

    // APPEND - READ
    console.log('calling - read');
    const read4 = await Apify.call(
        NAME,
        {
            spreadsheetId,
            mode: 'read',
        },
    ).then(((res) => res.output.body));
    console.log('done - read');

    console.log('trying assertion');
    assert.deepEqual(read4, mock1.concat(mock2).slice(1).concat(mock1.slice(0,1)));
    console.log('assertion done');

    // TEST 5
    console.log('TEST-5');
    //
    console.log('calling - load backup');
    await Apify.call(
        NAME,
        {
            spreadsheetId,
            mode: 'load backup',
            backupStore: defaultKeyValueStoreId,
        },
    );
    console.log('done - load backup');

    console.log('calling - read');
    const read5 = await Apify.call(
        NAME,
        {
            spreadsheetId,
            mode: 'read',
        },
    ).then(((res) => res.output.body));
    console.log('done - read');

    console.log('trying assertion');
    assert.deepEqual(read5, mock1.concat(mock2).slice(1));
    console.log('assertion done');
});