/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define([], function () {
    'use strict';
    var _memory = {};

    _memory.__proto__ = {
        'create': function (dbName) {
            //this[dbName] = eventHub.connect(new DB(dbName));
            this[dbName] = new DB(dbName);

            return this[dbName];
        },
        'drop': function (dbName) {
            if (this[dbName]) {
                this[dbName] = null;
                delete this[dbName];

                return true;
            }

            return false;
        },
        'get': function (dbName) {
            return this[dbName];
        }
    };

    var DB = function (dbName) {
        this._event = dbName;
    };

    DB.prototype = {
        'constructor': DB,
        '_event': '',
        '_tableCount': 0,
        'count': function () {
            return this._tableCount;
        },
        'createTable': function (tableName) {
            /**
             * createTable adds a new Table Object <tableName> to the DB Object
             *             dispatches a 'tableName' event for any event listeners
             * @param {String} tableName Name to assign to the new table
             * @returns {Function} Returns a curried function waiting for the columns argument
             */
            return function (/*columns*/) {
                var db = this.db,
                    columns = Array.prototype.slice.call(arguments),
                    path = db._event,
                    table = new Table(columns, db, path + '.' + this.tableName);

                db[tableName] = table;
                ++this._tableCount;

                // todo: unlock dispatch
                /*this.dispatch(path, {
                    'target': this,
                    'type': 'Create',
                    'value': table
                });*/
                return table;
            }.bind({
                'db': this,
                'tableName': tableName
            });
        },
        'alterTable': function (tableName) {
            var table = this[tableName];

            return {
                'add': function (/*columns*/) {
                    var cols = Array.from(arguments),
                        col, i = 0, len = cols.length,
                        indices = table.indices(),
                        holes = table.holes(),
                        j = 0, jLen = indices.length,
                        newColumn;

                    for (i; i < len; ++i) {
                        col = cols[i];
                        newColumn = table[col] = [];
                        for (j = 0; j < jLen; ++j) {
                            newColumn[indices[j]] = undefined;
                        }
                        jLen = holes.length;
                        for (j = 0; j < jLen; ++j) {
                            newColumn[holes[j]] = null;
                        }
                    }

                    return table;
                },
                'drop': function (/*columns*/) {
                    var cols = Array.from(arguments),
                        col, i = 0, len;

                    if (cols.length === 0 || cols[0] === '*') {
                        cols = table.columns();
                    }

                    for (len = cols.length; i < len; ++i) {
                        col = cols[i];
                        table[col] = null;
                        delete table[col];
                    }

                    return table;
                },
                'modify': function () {
                    // only needed if I support data types on columns
                }
            }
        },
        'drop': function (tableName) {
            if (this[tableName]) {
                this[tableName] = null;
                delete this[tableName];
                --this._tableCount;
                return true;
            }
        },
        'newSelect': function (/*columns*/) {

        },
        'select': function (/*columns*/) {
            var selectObject = createSelect(),
                from = selectObject.from.bind(selectObject),
                doSelect = function (/*columns*/) {
                    selectObject.select.apply(selectObject, arguments);

                    return {
                        'from': from
                    }
                };

            selectObject._db = this;
            selectObject.select.apply(selectObject, arguments);
            // TODO: refactor this into the selectObject
            // Goal is to not need to call select in order to access these as properties
            return {
                'distinct': function (/*columns*/) {
                    selectObject.distinct();
                    return doSelect.apply(this, arguments);
                },
                'min': function (/*columns*/) {
                    selectObject.min();
                    return doSelect.apply(this, arguments);
                },
                'max': function (/*columns*/) {
                    selectObject.max();
                    return doSelect.apply(this, arguments);
                },
                'sum': function (/*columns*/) {
                    selectObject.sum();
                    return doSelect.apply(this, arguments);
                },
                'avg': function (/*columns*/) {
                    selectObject.avg();
                    return doSelect.apply(this, arguments);
                },
                'count': function (/*columns*/) {
                    if (arguments && arguments[0] === '*') {
                        return {
                            'from': function (tableName) {
                                return {
                                    'go': function() {
                                        return selectObject._db[tableName].columns().length
                                    }
                                };
                            }
                        }
                    }
                    selectObject.count();
                    return doSelect.apply(this, arguments);
                },
                'from': from
            }
        },
        'insertInto': function (tableName) {
            return function (/*columns*/) {
                var insertValues = function (/*values*/) {
                    var table = this.table,
                        columns = Array.from(this.columns),
                        values = Array.from(arguments),
                        targetIndex = -1,
                        prop;

                    for (prop in table) {
                        if (table.hasOwnProperty(prop)) {
                            targetIndex = columns.indexOf(prop);
                            if (targetIndex > -1) {
                                table[prop].push(values.splice(targetIndex, 1)[0]);
                                columns.splice(targetIndex, 1);
                            } else {
                                table[prop].push(undefined);
                            }
                        }
                    }

                    return insertValues;
                }.bind({
                    'table': this,
                    'columns': Array.from(arguments)
                });

                return {
                    'values': insertValues,
                    // todo: this... (support for copy data from source table to destination table)
                    'select': function (/*columns*/) {
                        // columns to insert values
                        return {
                            'from': function (/*tables*/) {
                                // source_tables
                                return {
                                    'where': function (/*conditions*/) {
                                        // perform copy and return table or ???
                                    }
                                }
                            }
                        }
                    }
                };
            }.bind(this[tableName]);
        },
        'update': function (tableName) {
            var table = this[tableName],
                updateMap = {},
                set = function (column, value) {
                    updateMap[column] = value;

                    return set;
                };

            set.where = function (column, comperator, control) {
                var where = createWhere(column, comperator, control, table, false),
                    go = function (matchesArray) {
                        // todo: clean up all these uses of forEach during hardening
                        matchesArray.forEach(function(i) {
                            var prop;

                            for (prop in table) {
                                if (table.hasOwnProperty(prop) && updateMap[prop]) {
                                    table[prop][i] = updateMap[prop];
                                }
                            }
                        });
                        // todo: return something more meaningful?
                        return table;
                    };

                where.go = where._go(go);

                return where;
            };

            return {
                'set': set
            }
        },
        'delete': function (/*columns*/) {
            var columns = Array.from(arguments),
                db = this;

            return {
                'from': function (tableName) {
                    var table = db[tableName],
                        go = function (matchesArray) {
                            var matches = matchesArray;

                            if (!matches) {
                                matches = table.indices();
                                // table.indices gives all possible matches
                            }

                            matches.forEach(function (ndx) {
                                var i = 0, len = columns.length, column;

                                for (i; i < len; ++i) {
                                    column = table[columns[i]];
                                    column[ndx] = null;
                                }
                            });

                            return table;
                        };

                    if (columns.length === 0 || columns[0] === '*') {
                        columns = table.columns();
                    }

                    return {
                        'where': function (column, comperator, control) {
                            var where = createWhere(column, comperator, control, table, false);

                            where.go = where._go(go);

                            return where;
                        },
                        'go': go
                    };
                }
            }
        }
    };

    DB.prototype.select.prototype = {
        '_columnNames': {},
        '_queryColumns': [],
        '_addColumns': function (columns, mixins) {
            var i = 0, len = columns.length,
                queryColumns = this._queryColumns,
                columnNames = this._columnNames,
                queryColumn, prop, columnName,
                getQueryColumn = function (qc) {
                    var b = qc['column'] === this.columnName;

                    if (b) {
                        queryColumn = qc['column'];
                    }

                    return b;
                };

            for (i; i < len; ++i) {
                columnName = columns[i];
                if (columnNames.hasOwnProperty(columnName)) {
                    // get QueryColumn Object to update
                    queryColumns.some(getQueryColumn.bind({'columnName': columnName}));
                } else {
                    // create new QueryColumn Object
                    queryColumn = new QueryColumn(columnName);
                    columnNames[columnName] = true;
                }

                if (mixins) {
                    for (prop in mixins) {
                        if (mixins.hasOwnProperty(prop)) {
                            queryColumn[prop] = mixins[prop];
                        }
                    }
                }

                queryColumns.push(queryColumn);
            }

            return queryColumns;
        },
        'distinct': function (/*columns*/) {
            var columns = Array.from(arguments);

            this._addColumns(columns, {'distinct': true});

            return this;
        },
        'min': function (/*columns*/) {
            var columns = Array.from(arguments);

            this._addColumns(columns, {'aggregate': 'min'});

            return this;
        },
        'max': function (/*columns*/) {
            var columns = Array.from(arguments);

            this._addColumns(columns, {'aggregate': 'max'});

            return this;
        },
        'sum': function (/*columns*/) {
            var columns = Array.from(arguments);

            this._addColumns(columns, {'aggregate': 'sum'});

            return this;
        },
        'avg': function (/*columns*/) {
            var columns = Array.from(arguments);

            this._addColumns(columns, {'aggregate': 'avg'});

            return this;
        },
        'count': function (/*columns*/) {
            var columns = Array.from(arguments);

            this._addColumns(columns, {'aggregate': 'count'});

            return this;
        },
        'from': function (tableName) {
            var table = this[tableName];

            return new From(table, this._queryColumns);
        }
    };

    var From = function (table, queryColumns) {
        this._table = table;
        this._queryColumns = queryColumns;
    };

    From.prototype = {
        '_table': undefined,
        '_queryColumns': undefined,
        'where': function (column, comperator, control) {
            var where = new Where(column, comperator, control, this._table, this._queryColumns);

            this.and = where.and;
            this.or = where.or;

            return this;
        },
        'innerJoin': function () {
            // return join object?
        },
        'leftJoin': function () {

        },
        'rightJoin': function () {

        },
        'fullJoin': function () {

        },
        'groupBy': function (/*columns*/) {

        },
        'go': function () {
            // where all the magic happens
        }
    };

    var Where = function (column, comperator, control, table, queryColumns) {
        this._table = table;
        this._queryColumns = queryColumns;
        this._matches = this._test(column, comperator, control);
    };

    Where.prototype = {
        '_table': undefined,
        '_queryColumns': [],
        '_matches': [],
        '_test': function (column, comperator, control) {
            var firstPeriod = control.indexOf('.'),
                secondPeriod = control.lastIndexOf('.'),
                startsWith = firstPeriod !== 0,
                endsWith = secondPeriod !== control.length - 1,
                table = this._table,
                db = table._db,
                tableName = table._event.substr(table._event.lastIndexOf('.') + 1),
                col = db[tableName][column] || [],
                matches;

            if (comperator === 'like' || comperator === 'not like') {
                if (startsWith) {
                    control = '^' + control;
                }
                if (endsWith) {
                    control += '$';
                }
            }

            matches = this._filter(col, comperator, control);

            return matches;
        },
        '_filter': function (column, comperator, control) {
            var i = 0, len = column.length, matches = [],
                found, row, inMatches, regX;

            for (i; i < len; ++i) {
                row = column[i];
                if (row) {
                    switch (comperator) {
                        case '==':
                            found = row == control;
                            break;
                        case '===':
                            found = row === control;
                            break;
                        case '>':
                            found = row > control;
                            break;
                        case '<':
                            found = row < control;
                            break;
                        case '>=':
                            found = row >= control;
                            break;
                        case '<=':
                            found = row <= control;
                            break;
                        case '!=':
                            found = row != control;
                            break;
                        case '!==':
                            found = row !== control;
                            break;
                        case 'like':
                            regX = new RegExp(control, 'i');
                            found = regX.test(row);
                            break;
                        case 'not like':
                            regX = new RegExp(control, 'i');
                            found = !regX.test(row);
                            break;
                        default:
                            found = false;
                    }

                    inMatches = this.matches.indexOf(i) > -1; // if already in matches, don't add it again...
                    if (found && !inMatches) {
                        matches.push(i);
                    }
                }
            }

            return matches;
        },
        'and': function (column, comperator, control) {
            var oldMatches = Array.from(this._matches),
                newMatches = this._test(column, comperator, control);

            this._matches = oldMatches.filter(function (match) {
                return newMatches.indexOf(match) !== -1;
            });

            return this;
        },
        'or': function (column, comperator, control) {
            var oldMatches = Array.from(this._matches),
                newMatches = this._test(column, comperator, control),
                i = 0, len = oldMatches.length, match;

            for (i; i < len; ++i) {
                match = oldMatches[i];
                if (newMatches.indexOf(match) === -1) {
                    newMatches.push(match);
                }
            }

            this.matches = newMatches;

            return this;
        },
        'go': function () {}
    };

    var go = function (caller) {
        var queryColumns = caller._queryColumns,
            table = caller._table,
            matches = caller._matches;

        if (queryColumns && table) {
            if (matches === undefined) {
                // no where condition was applied

            }
        }
    };

    var Table = function (columns, db, eventName) {
        var column, columnName, i = 0, len;

        this.__proto__ = {
            '_db': db,
            '_event': eventName,
            'constructor': this,
            'columns': function () {
                var cols = [], prop;

                for (prop in this) {
                    if (this.hasOwnProperty(prop)) {
                        cols.push(prop);
                    }
                }

                return cols;
            },
            'indices': function () {
                var indices = [],
                    col, prop, i = 0, len;

                for (prop in this) {
                    if (this.hasOwnProperty(prop)) {
                        col = this[prop];
                        for (len = col.length; i < len; ++i) {
                            if (col[i] !== null) {
                                indices.push(i);
                            }
                        }
                        return indices;
                    }
                }
            },
            'holes': function () {
                var holes = [],
                    col, prop, i = 0, len;

                for (prop in this) {
                    if (this.hasOwnProperty(prop)) {
                        col = this[prop];
                        for (len = col.length; i < len; ++i) {
                            if (col[i] === null) {
                                holes.push(i);
                            }
                        }
                        return holes;
                    }
                }
            }
        };

        for (len = columns.length; i < len; ++i) {
            columnName = columns[i];
            column = new Column();
            column.__proto__._db = db;
            column.__proto__._event = eventName + '.' + columnName;
            this[columnName] = column;
            // todo: dispatch update
        }

        return this;
    };

    var Column = function () {};

    Column.prototype = {
        'constructor': Column,
        '_event': '',
        '_db': undefined,
        'push': function (x) {
            // todo: dispatch update/add
            return Array.prototype.push.call(this, x);
        }
    };

    Column.prototype.__proto__ = Array.prototype;

    var QueryColumn = function (columnName) {
        this.columnName = columnName;
    };

    QueryColumn.prototype = {
        'columnName': '',
        'distinct': false,
        'aggregate': false,
        'isReturn': false
    };

    var QueryObject = function (table) {
        Object.defineProperty(this, 'table', {
            enumerable: false,
            configurable: false,
            writable: true,
            value: table
        });
    };

    QueryObject.prototype = {
        'table': undefined,
        'returnColumns': []
        // todo: groupBy, sortBy, etc???
    };

    var selectPrototype = function () {
        return {
            '_db': undefined,
            '_isDistinct': false,
            '_returnColumns': [],
            '_table': undefined,
            '_aggregate': false,
            '_setReturnColumns': function (/*columns*/) {
                var returnColumns = Array.from(arguments);

                if (this._table && (returnColumns.length === 0 || returnColumns[0] === '*')) {
                    returnColumns = Object.keys(this._table);
                }

                this._returnColumns = returnColumns;
            },
            '_getReturnArray': function () {
                var returnObj = {}, returnArray = [], cache = {}, columnCache = [],
                    columnName, column, currentRowValue, canPush = true,
                    i, j, rowCount, returnColumnCount,
                    isDistinct = this._isDistinct,
                    table = this._table,
                    returnColumns = this._returnColumns,
                    setCache = function () {
                        if (!cache[columnName]) {
                            cache[columnName] = [];
                        }
                        columnCache = cache[columnName];

                        return columnCache;
                    };

                if (table) {
                    columnName = returnColumns[0];
                    column = table[columnName] || [];
                    rowCount = column.length;
                    returnColumnCount = returnColumns.length;

                    for (i = 0; i < rowCount; ++i) {
                        currentRowValue = column[i];
                        setCache();
                        // skip holes <null>, these are 'dead indices'
                        if (currentRowValue !== null && (!isDistinct || columnCache.indexOf(currentRowValue) === -1)) {
                            returnObj[columnName] = currentRowValue;
                            columnCache.push(currentRowValue);
                            for (j = 1; j < returnColumnCount; ++j) {
                                columnName = returnColumns[j];
                                column = table[columnName];
                                currentRowValue = column[i];
                                setCache();
                                if (!isDistinct || columnCache.indexOf(currentRowValue) === -1) {
                                    returnObj[columnName] = currentRowValue;
                                    columnCache.push(currentRowValue);
                                } else {
                                    canPush = false;
                                }

                            }
                            if (canPush) {
                                returnArray.push(returnObj);
                                columnName = returnColumns[0];
                                column = table[columnName];
                                returnObj = {};
                            }
                        }
                    }
                }

                return returnArray;
            },
            'select': function (/*columnNames*/) {
                if (arguments[0]) {
                    this._setReturnColumns.apply(this, arguments);
                }
            },
            'distinct': function () {
                this._isDistinct = true;
            },
            'from': function (tableName) {
                this._table = this._db[tableName];

                if (this._returnColumns.length === 0 || this._returnColumns[0] === '*') {
                    this._setReturnColumns.apply(this, ['*']);
                }

                return {
                    'where': this.where.bind(this),
                    'go': this.go.bind(this)
                }
            },
            'where': function (column, comparator, control) {
                var where = createWhere(column, comparator, control, this._table),
                    go = this.go.bind(this);

                where.go = where._go(go);

                return where;
            },
            'go': function (matchesArray) {
                var result = this._getReturnArray();

                if (matchesArray !== undefined) {
                    result = result.filter(function (row, i) {
                        return matchesArray.indexOf(i) !== -1;
                    });
                }
                if (this._aggregate) {
                    switch (this._aggregate) {
                        case 'min': result = aggregateFunction(result, 'min');
                            break;
                        case 'max': result = aggregateFunction(result, 'max');
                            break;
                        case 'sum': result = aggregateFunction(result, 'sum');
                            break;
                        case 'avg': result = aggregateFunction(result, 'avg');
                            break;
                        case 'count': result = aggregateFunction(result, 'count');
                            break;
                        default:
                    }
                }

                return result;
            },
            'min': function () {
                this._aggregate = 'min';
            },
            'max': function () {
                this._aggregate = 'max';
            },
            'sum': function () {
                this._aggregate = 'sum';
            },
            'avg': function () {
                this._aggregate = 'avg';
            },
            'count': function () {
                this._aggregate = 'count';
            }
        };
    };

    var createSortObject = function (dataArray) {
        // dataArray should be the return from _getReturnArray()
        // create an object with columns of data
        // data is in array form and can be filtered, etc.
        var i = 0, len = dataArray.length,
            columnName, dataObject, sortObject = {};

        for (i; i < len; ++i) {
            dataObject = dataArray[i];
            // set up columns to filter in sortObject
            for (columnName in dataObject) {
                if (dataObject.hasOwnProperty(columnName)) {
                    if (i === 0) {
                        sortObject[columnName] = [];
                    }
                    sortObject[columnName].push(dataObject[columnName]);
                }
            }
        }

        return sortObject;
    };

    var aggregateFunction = function (dataArray, operation) {
        // sortObject contains the columns to perform the aggregate function on
        var columnName, sortArray, sortArrayLength,
            sortObject = createSortObject(dataArray);

        for (columnName in sortObject) {
            if (sortObject.hasOwnProperty(columnName)) {
                sortArray = sortObject[columnName];
                sortArrayLength = sortArray.length;
                sortArray = sortArray.reduce(function (previous, current) {
                    var rtn;

                    if (operation === 'min') {
                        rtn = previous < current ? previous : current;
                    } else if (operation === 'max') {
                        rtn = previous > current ? previous : current;
                    } else if (operation === 'sum' || operation === 'avg') {
                        rtn = previous + current;
                    }

                    return rtn;
                });
                if (operation === 'avg') {
                    sortArray = sortArray / sortArrayLength;
                } else if (operation === 'count') {
                    sortArray = sortArrayLength;
                }
                sortObject[columnName] = sortArray;
            }
        }

        return sortObject;
    };

    return {
        'createDB': _memory.create,
        'dropDB'  : _memory.drop,
        'getDB'   : _memory.get
    };
});