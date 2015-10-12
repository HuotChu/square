/**
 * Created by Scott on 6/1/2015.
 */
define(function() {
    'use strict';

    var _store = {
        'db-1': { // database name aka name for collection of 'tables'
            'users': { // table name aka name for grouping of data with a similar purpose or topic
                'user-name': { // row name
                    'domain': /[\w\d\-_]{2,15}/i, // domain has not been implemented yet
                    'data': [
                        'lawebtek',
                        'jaime',
                        'user-3_index-2'
                    ]
                },
                'user-id': { // row name
                    'primary': true,  // not implemented yet
                    'auto': true,     // not implemented yet
                    'domain': /\d/,
                    'data': [
                        0,
                        1,
                        2
                    ]
                },
                'user-email': { // row name
                    'domain': /^[\w\d.!#$%&'*+/=?^_`{|}~-]+@[\w\d](?:[\w\d-]{0,61}[\w\d])?(?:\.[\w\d](?:[\w\d-]{0,61}[\w\d])?)*$/i,
                    'data': [
                        'me@gmail.com',
                        'someone@gmail.com',
                        'user-3_index-2@some.reallyLongTLD'
                    ]
                }
            },
            'books': { // table name
                'book-title': { // row name
                    'domain': /[\w\d\-_\s'\.\?!&]{2,60}/i,
                    'data': [
                        'One Flew Over the Cuckoo\'s Nest',
                        'Tommy Knockers',
                        'One Fish Two Fish Red Fish Blue Fish'
                    ]
                },
                'book-id': { // row name
                    'primary': true,
                    'domain': /[\d\w\-]+/i,
                    'data': [
                        'CF10239843-fr987',
                        '555-abc-12-us54323',
                        'KF0009878US'
                    ]
                },
                'book-price': { // row name
                    'domain': /^\$\d{1,9}\.\d{2}$/i,
                    'data': [
                        '$15.00',
                        '$29.95',
                        '$0.99'
                    ]
                }
            }

            /*
             'books': { // table name
                'CF10239843-fr987': { // 'book-id' && primary key
                    'book-id': 'CF10239843-fr987',
                    'book-title': 'One Flew Over the Cuckoo\'s Nest',
                    'book-price': '$15.00'
                },
                '555-abc-12-us54323': {
                    'book-id': '555-abc-12-us54323',
                    'book-title': 'Tommy Knockers',
                    'book-price': '$29.95'
                },
                'KF0009878US': {
                    'book-id': 'KF0009878US',
                    'book-title': 'One Fish Two Fish Red Fish Blue Fish',
                    'book-price': '$29.95'
                },
                'j$_validate': {
                    'book-id': /[\d\w\-]+/i,
                    'book-title': /[\w\d\-_\s'\.\?!&]{2,60}/i,
                    'book-price': /^\$\d{1,9}\.\d{2}$/i
                },
                'j$_objectArray': [ // created by jSQL! => pointers to the objects above
                    {CF10239843-fr987}, {555-abc-12-us54323}, {KF0009878US}
                ]
             }
            */

        }
    };

    var get = function (dbName) {
        return _store[dbName];
    };

    // Data Manipulation Methods
    var create = {
        '_using': undefined,
        'db': function(dbName) {
            if (!_store[dbName]) {
                _store[dbName] = {};
            }

            this._using = _store[dbName];

            return create;
        },
        'table': function(tableName, dbName) {
            var db = dbName ? _store[dbName] : this._using,
                newTable;

            newTable = db[tableName] = {};
            this._using = db;

            return function(rows) {
                // rows is a multidimensional array [ ['rowName1', {row object 1}], ['rowName2', {row object 2}] ]
                var i = 0,
                    len = rows.length,
                    row;

                for (i; i < len; ++i) {
                    row = rows[i];
                    newTable[row[0]] = row[1];
                }
            };
        },
        'showDB': function(dbName) {
            console.log(_store[dbName]);
        }
    };

    // Query Methods
    /*
    * o should be an object with the following properties:
    * (select and from are required, the rest are optional)
    * {
    *     'select':   // *** column selection or * all columns
    *     'from':     // *** table(s) to retrieve data from
    *     'distinct': // true or false (default)
    *     'join':     // type of join to perform
    *     'where':    // condition to eliminate unwanted data
    *     'group':    // column name(s) to group by?
    *     'having':   // condition to filter return from 'group'
    *     'order':    // column to sort on and sort direction/algorithm
    * }
    */
    var select = function(dbName, o) {
        var db = _store[dbName],
            from = o.from.split(','),
            currentTable = from[0],
            table = Object.create(db[currentTable]), // todo: support multiple tables
            returnSet = o.select.split(','),
            where = o.where,
            searchColumns = (function() {
                var obj = {},
                    arr = [];

                if (returnSet[0].trim() === '*') {
                    returnSet = arr = Object.keys(table.__proto__);
                } else {
                    if (where) {
                        where.forEach(function(e) {
                            obj[e.column] = true;
                        });
                    }

                    returnSet = returnSet.map(function(e) {
                        var trimmedVal = e.trim();

                        obj[trimmedVal] = true;

                        return trimmedVal;
                    });

                    for (var prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            arr.push(prop);
                        }
                    }
                }

                return arr;
            }()),
            columnName,
            columnCount = searchColumns.length,
            distinct = o.distinct,
            aTemp = [],
            currentValue,
            results = {},
            i = 0,
            validIndices = [],
            valueSet = {},
            setDistinctIndices = function (e, ndx) {
                var isDistinct = !aTemp.some(function(el) {
                    return el === e;
                });

                aTemp.push(e);

                if (isDistinct && validIndices[ndx] !== false) {
                    validIndices[ndx] = true;
                }
            },
            setWhereIndices = function (e, ndx) {
                var bool,
                    n = ndx + '',
                    val = where.value;

                if (typeof e === "string") {
                    e = '"' + e + '"';
                }

                if (typeof val === "string") {
                    val = '"' + val + '"';
                }

                bool = eval(e + where.operator + val);

                if (bool && !distinct) {
                    validIndices[n] = true;
                } else if (!bool && validIndices[n]) {
                    validIndices[n] = false;
                }
            },
            getValidIndice = function (ele, ndx) {
                return validIndices[ndx];
            };

        for (i; i < columnCount; ++i) {
            columnName = searchColumns[i];
            currentValue = table[columnName].data;

            if (distinct) {
                aTemp = [];
                currentValue.forEach(setDistinctIndices);
            }

            if (where) {
                /* COMING SOON, "and/or" support...

                where.forEach(function(w) {
                    var col = w.column,
                        op = w.operator,
                        v = w.value;

                });

                */

                if (where[0]) {
                    where = where[0]; // for now... need to enumerate these later
                }

                if (columnName === where.column) {
                    currentValue.forEach(setWhereIndices);
                }
            }

            valueSet[columnName] = {
                'value': currentValue
            };
        }

        if (!results[currentTable]) {
            results[currentTable] = {};
        }

        for (i = 0, columnCount = returnSet.length; i < columnCount; ++i) {
            var val;

            columnName = returnSet[i];

            val = valueSet[columnName].value;

            if (where || distinct) {
                val = val.filter(getValidIndice);
            }

            Object.defineProperty(results[currentTable], columnName, {
                enumerable: false,
                configurable: false,
                writable: false,
                value: val
            });
        }

        return Object.freeze(results);
    };

    // Convenience Methods
    String.prototype.trim = function() {
        return this.replace(/^\s|\s$/g, '');
    };

    return {
        'db': get,
        'create': create,
        'select': select
    };
});