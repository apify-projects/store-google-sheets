const assert = require('assert');

const { toObjects, toRows, updateRowsObjects, makeUniqueRows, parseRange } = require('../src/utils.js');
// const { customTransform1, reconstructArray, pseudoDeepEquals, createKeys } = require('../src/transformFunctions');
// const { customObjectsNew, customObjectsOld, customObjFlat, customObjFlat2, transformedArray } = require('./mocks');

const rows = [['a', 'b', 'c'], [2, 2, 4], [3, 2, 5], [4, 2, 5]];
const objects = [{ a: 2, b: 2, c: 4 }, { a: 3, b: 2, c: 5 }, { a: 4, b: 2, c: 5 }];
const objects2 = [{ d: 4, b: 2, c: null }, { d: 3, b: 2, c: 6 }, { d: 4, b: null, c: 5 }];
const appendedBasic = [
    { a: 2, b: 2, c: 4, d: '' },
    { a: 3, b: 2, c: 5, d: '' },
    { a: 4, b: 2, c: 5, d: '' },
    { a: '', b: 2, c: '', d: 4 },
    { a: '', b: 2, c: 6, d: 3 },
    { a: '', b: '', c: 5, d: 4 },
];
const uniqueToAppend = [
    { a: 2, b: 2, c: 4, d: '' },
    { d: 4, b: '', c: 5, a: '' },
];
const appendedWithFilterField = [
    { a: 2, b: 2, c: 4, d: '' },
    // { a: 3, b: 2, c: 5, d: null },
    // { a: 4, b: 2, c: 5, d: null },
    { a: '', b: '', c: 5, d: 4 },
];
const replacedWithFilterField = [
    { d: 4, b: 2, c: '' },
    { d: 4, b: '', c: 5 },
];

// const keysToCompare = createKeys(customObjFlat2, customObjFlat);
// const promotionKeys = keysToCompare.filter((key) => key.startsWith('promotions/'));

/*
describe('pseudoDeepEquals', () => {
    it('works', () => {
        assert.deepEqual(pseudoDeepEquals(customObjFlat2, customObjFlat, keysToCompare, promotionKeys), true);
    });
});

describe('reconstructArray', () => {
    it('works', () => {
        assert.deepEqual(reconstructArray(customObjFlat, promotionKeys), transformedArray);
    });
});

describe('customTransform1', () => {
    const customTransform = customTransform1;
    const finalObjects = [];
    it('works', () => {
        assert.deepEqual(customTransform(customObjectsNew, customObjectsOld), finalObjects);
    });
});
*/

describe('toObjects', () => {
    it('works', () => {
        // console.log('to objects')
        // console.dir(objects)
        // console.dir(toObjects(rows))
        assert.deepEqual(objects, toObjects(rows));
    });
});

describe('toRows', () => {
    it('works', () => {
        // console.log('to rows')
        // console.dir(rows)
        // console.dir(toRows(objects))
        assert.deepEqual(rows, toRows(objects));
    });
});

describe('replace', () => {
    it('basic', () => {
        assert.deepEqual(objects2, updateRowsObjects({ oldObjects: [], newObjects: objects2 }));
    });
    it('with field filter', () => {
        assert.deepEqual(replacedWithFilterField, updateRowsObjects({ oldObjects: [], newObjects: objects2, filterByField: 'b' }));
    });
});

describe('append', () => {
    it('basic', () => {
        assert.deepEqual(appendedBasic, updateRowsObjects({ oldObjects: objects, newObjects: objects2 }));
    });
    it('with field filter', () => {
        assert.deepEqual(appendedWithFilterField, updateRowsObjects({ oldObjects: objects, newObjects: objects2, filterByField: 'b' }));
    });
});

describe('makeUniqueRows', () => {
    it('works', () => {
        assert.deepEqual(uniqueToAppend, makeUniqueRows(objects, objects2, 'b', null));
    });
});

describe('parseRange', () => {
    it('parses sheet name only', () => {
        assert.deepEqual(parseRange({ range: 'Sheet1' }), {
            sheetName: 'Sheet1',
            startColumn: 'A',
            startRow: 1,
        });
    });

    it('parses sheet name with spaces', () => {
        assert.deepEqual(parseRange({ range: 'My Sheet' }), {
            sheetName: 'My Sheet',
            startColumn: 'A',
            startRow: 1,
        });
    });

    it('parses sheet name with A1 notation', () => {
        assert.deepEqual(parseRange({ range: 'Sheet1!A1' }), {
            sheetName: 'Sheet1',
            startColumn: 'A',
            startRow: 1,
        });
    });

    it('parses sheet name with offset cell', () => {
        assert.deepEqual(parseRange({ range: 'Sheet1!C5' }), {
            sheetName: 'Sheet1',
            startColumn: 'C',
            startRow: 5,
        });
    });

    it('parses multi-letter column', () => {
        assert.deepEqual(parseRange({ range: 'Data!AA100' }), {
            sheetName: 'Data',
            startColumn: 'AA',
            startRow: 100,
        });
    });

    it('parses sheet name containing special characters with A1', () => {
        assert.deepEqual(parseRange({ range: 'My Sheet!B2' }), {
            sheetName: 'My Sheet',
            startColumn: 'B',
            startRow: 2,
        });
    });

    it('parses full range A1:B2', () => {
        assert.deepEqual(parseRange({ range: 'Sheet1!A1:B2' }), {
            sheetName: 'Sheet1',
            startColumn: 'A',
            startRow: 1,
            endColumn: 'B',
            endRow: 2,
        });
    });

    it('parses full range with multi-letter columns', () => {
        assert.deepEqual(parseRange({ range: 'Data!AA1:ZZ100' }), {
            sheetName: 'Data',
            startColumn: 'AA',
            startRow: 1,
            endColumn: 'ZZ',
            endRow: 100,
        });
    });

    it('parses full range with spaces in sheet name', () => {
        assert.deepEqual(parseRange({ range: 'My Sheet!C3:D10' }), {
            sheetName: 'My Sheet',
            startColumn: 'C',
            startRow: 3,
            endColumn: 'D',
            endRow: 10,
        });
    });

    // Full columns
    it('parses full columns with sheet name', () => {
        assert.deepEqual(parseRange({ range: 'Sheet1!A:B' }), {
            sheetName: 'Sheet1',
            startColumn: 'A',
            endColumn: 'B',
        });
    });

    it('parses single full column with sheet name', () => {
        assert.deepEqual(parseRange({ range: 'Sheet1!A:A' }), {
            sheetName: 'Sheet1',
            startColumn: 'A',
            endColumn: 'A',
        });
    });

    it('parses full columns without sheet name', () => {
        assert.deepEqual(parseRange({ range: 'A:B' }), {
            startColumn: 'A',
            endColumn: 'B',
        });
    });

    it('parses multi-letter full columns', () => {
        assert.deepEqual(parseRange({ range: 'Sheet1!AA:ZZ' }), {
            sheetName: 'Sheet1',
            startColumn: 'AA',
            endColumn: 'ZZ',
        });
    });

    // Full rows
    it('parses full rows with sheet name', () => {
        assert.deepEqual(parseRange({ range: 'Sheet1!1:5' }), {
            sheetName: 'Sheet1',
            startRow: 1,
            endRow: 5,
        });
    });

    it('parses single full row with sheet name', () => {
        assert.deepEqual(parseRange({ range: 'Sheet1!1:1' }), {
            sheetName: 'Sheet1',
            startRow: 1,
            endRow: 1,
        });
    });

    it('parses full rows without sheet name', () => {
        assert.deepEqual(parseRange({ range: '1:5' }), {
            startRow: 1,
            endRow: 5,
        });
    });

    // Without sheet name
    it('parses single cell without sheet name', () => {
        assert.deepEqual(parseRange({ range: 'A1' }), {
            startColumn: 'A',
            startRow: 1,
        });
    });

    it('parses cell range without sheet name', () => {
        assert.deepEqual(parseRange({ range: 'A1:B2' }), {
            startColumn: 'A',
            startRow: 1,
            endColumn: 'B',
            endRow: 2,
        });
    });

    // firstSheetName fallback
    it('falls back to firstSheetName when range is not provided', () => {
        assert.deepEqual(parseRange({ firstSheetName: 'FallbackSheet' }), {
            sheetName: 'FallbackSheet',
            startColumn: 'A',
            startRow: 1,
        });
    });

    it('uses range over firstSheetName when both provided', () => {
        assert.deepEqual(parseRange({ range: 'Sheet1!B3', firstSheetName: 'FallbackSheet' }), {
            sheetName: 'Sheet1',
            startColumn: 'B',
            startRow: 3,
        });
    });

    it('falls back to firstSheetName when range is empty string', () => {
        assert.deepEqual(parseRange({ range: '', firstSheetName: 'FallbackSheet' }), {
            sheetName: 'FallbackSheet',
            startColumn: 'A',
            startRow: 1,
        });
    });

    // Errors
    it('returns null for invalid ref after sheet name', () => {
        assert.strictEqual(parseRange({ range: 'Sheet1!' }), null);
    });
});
