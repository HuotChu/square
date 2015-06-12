/**
 * Created by Scott on 6/1/2015.
 */
define(function() {
    'use strict';

    var _store = {
        'db-1': { // database name
            'users': { // table name
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
                    'PRIMARY': true,
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
        }
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

            return function(columns) {
                // columns is a multidimensional array [ ['rowName1', {row object 1}], ['rowName2', {row object 2}] ]
                var i = 0,
                    len = columns.length,
                    column;

                for (i; i < len; ++i) {
                    column = columns[i];
                    newTable[column[0]] = column[1];
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
            from = o['from'].split(','),
            currentTable = from[0],
            table = Object.create(db[currentTable]), // todo: support multiple tables
            returnSet = o['select'].split(','),
            where = o['where'],
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
                        arr.push(prop);
                    }
                }

                return arr;
            }()),
            columnName,
            columnCount = searchColumns.length,
            distinct = o['distinct'],
            aTemp = [],
            currentValue,
            results = {},
            i = 0,
            validIndices = [],
            valueSet = {};

        for (i; i < columnCount; ++i) {
            columnName = searchColumns[i];
            currentValue = table[columnName].data;

            if (distinct) {
                aTemp = [];

                currentValue.forEach(function(e, ndx) {
                    var isDistinct = !aTemp.some(function(el) {
                        return el === e;
                    });

                    aTemp.push(e);

                    if (isDistinct && validIndices[ndx] !== false) {
                        validIndices[ndx] = true;
                    }
                });
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
                    currentValue.forEach(function(e, ndx) {
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
                    });
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
                val = val.filter(function (ele, ndx) {
                    return validIndices[ndx];
                });
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
        'create': create,
        'select': select
    };
});