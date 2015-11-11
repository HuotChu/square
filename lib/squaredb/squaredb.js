/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['../square', './comparator', './Select', './tableObjects'], function (square, comparator, Select, tableObjects) {
    'use strict';

    var Table = tableObjects.Table,
        Column = tableObjects.Column,
        _memory = {},
        getColumnNames = function (/*columns*/) {
            var columnNames = Array.from(arguments);

            if (columnNames.length === 1 && columnNames[0].indexOf(',') !== -1) {
                columnNames = columnNames[0].split(',').map(function (el) {
                    return el.trim();
                });
            }

            return columnNames;
        },
        Where = function (table, column, operator, control) {
            this.validIndices = comparator(table[column], operator, control);
            this.AND = this.and = function (column, operator, control) {
                var newIndices = comparator(table[column], operator, control);

                this.validIndices = this.validIndices.filter(function (v) {
                    return newIndices.indexOf(v) !== -1;
                });

                return this;
            };
            this.OR = this.or = function (column, operator, control) {
                var cache = [];

                this.validIndices = this.validIndices.concat(comparator(table[column], operator, control));

                this.validIndices = this.validIndices.filter(function (v) {
                    if (cache.indexOf(v) === -1) {
                        cache.push(v);
                        return true;
                    }
                });

                return this;
            };
        };

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
        },
        'show': function () {
            var prop, arr = [];

            for (prop in this) {
                if (this.hasOwnProperty(prop)) {
                    arr.push(prop);
                }
            }

            return arr;
        }
    };

    var DB = function DB (dbName) {
        this._event = dbName;
    };

    DB.prototype = {
        'constructor': DB,
        '_event': '',
        '_tableCount': 0,
        'count': function () {
            return this._tableCount;
        },
        'COUNT': function () {
            return this._tableCount;
        },
        'select': function (/*selects*/) {
            var selects = getColumnNames.apply({}, arguments);

            return new Select(this, selects);
        },
        'SELECT': function (/*selects*/) {
            return this.select.apply(this, arguments);
        },
        'createTable': function (tableName) {
            /**
             * createTable adds a new Table Object <tableName> to the DB Object
             * @param {String} tableName Name to assign to the new table
             * @returns {Function} Returns a curried function waiting for the columns argument
             */
            var db = this,
                table = new Table(db, tableName);

            db[tableName] = table;
            ++db._tableCount;

            return function (/*columns*/) {
                var columns = getColumnNames.apply({}, arguments);

                if (columns.length) {
                    db.alterTable(tableName).add.apply({}, arguments);
                }

                return table;
            };
        },
        'CREATE_TABLE': function (tableName) {
            return this.createTable.call(this, tableName);
        },
        'alterTable': function (tableName) {
            var table = this[tableName];

            return {
                'add': function (/*columns*/) {
                    var cols = getColumnNames.apply({}, arguments),
                        col, i = 0, len = cols.length,
                        indices = table.indices(),
                        holes = table.holes(),
                        j = 0, jLen = indices.length,
                        newColumn;

                    for (i; i < len; ++i) {
                        col = cols[i];
                        newColumn = table[col] = new Column(table, col);
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
                'ADD': function (/*columns*/) {
                    return this.add.apply(this, arguments);
                },
                'drop': function (/*columns*/) {
                    var cols = getColumnNames.apply({}, arguments),
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
                'DROP': function (/*columns*/) {
                    return this.drop.apply(this, arguments);
                },
                'modify': function () {
                    // only needed if I support data types on columns
                }
            }
        },
        'ALTER_TABLE': function (tableName) {
            return this.alterTable.call(this, tableName);
        },
        'insertInto': function (tableName) {
            var table = this[tableName];

            return function (/*columns*/) {
                var columns = getColumnNames.apply({}, arguments),
                    values = function values (/*insertValues*/) {
                        var vals = Array.from(arguments),
                            columnName, prop,
                            i = 0, len = columns.length;

                        for (i; i < len; ++i) {
                            columnName = columns[i];
                            table[columnName].push(vals[i]);
                        }

                        for (prop in table) {
                            if (table.hasOwnProperty(prop)) {
                                if (columns.indexOf(prop) === -1) {
                                    table[prop].push(undefined);
                                }
                            }
                        }

                        return values;
                    };

                return {
                    'values': values,
                    'VALUES': values
                };
            };
        },
        'INSERT_INTO': function (tableName) {
            return this.insertInto.call(this, tableName);
        },
        'insertJSON': function (insertObjects /*Array*/) {
            // todo: add this
        },
        'INSERT_JSON': function (insertObjects /*Array*/) {
            // todo: add this
        },
        'update': function (tableName) {
            var table = this[tableName],
                updateMap = {},
                set = function (column, value) {
                    updateMap[column] = value;

                    return set;
                };

            set.WHERE = set.where = function (column, operator, control) {
                var w = new Where(table, column, operator, control);

                w.GO = w.go = function () {
                    var i = 0, len = this.validIndices.length, ndx, prop;

                    for (i; i < len; ++i) {
                        ndx = this.validIndices[i];
                        for (prop in table) {
                            if (table.hasOwnProperty(prop) && updateMap[prop]) {
                                table[prop][ndx] = updateMap[prop];
                            }
                        }
                    }

                    return true;
                };

                return w;
            };

            return {
                'set': set,
                'SET': set
            }
        },
        'UPDATE': function (tableName) {
            return this.update.call(this, tableName);
        },
        'delete': function (/*columnNames*/) {
            var columns = getColumnNames.apply({}, arguments),
                db = this,
                table,
                from = function (tableName) {
                    table = db[tableName];
                    if (columns.length === 0 || columns[0] === '*') {
                        columns = table.columns();
                    }

                    return {
                        'where': where,
                        'WHERE': where,
                        'go': go,
                        'GO': go
                    }
                },
                go = function () {
                    var matches = this.validIndices,
                        i = 0, len, ndx, j, colLen = columns.length, column;

                    if (matches === undefined) {
                        matches = table.indices();
                        // table.indices gives all possible matches
                    }

                    for (i, len = matches.length; i < len; ++i) {
                        ndx = matches[i];
                        for (j = 0; j < colLen; ++j) {
                            column = table[columns[j]];
                            column[ndx] = null;
                        }
                    }

                    return true;
                },
                where = function (column, operator, control) {
                    var w = new Where(table, column, operator, control);

                    w.GO = w.go = go.bind(w);

                    return w;
                };

            return {
                'from': from,
                'FROM': from
            };
        },
        'DELETE': function (/*columnNames*/) {
            return this.delete.apply(this, arguments);
        }
    };

    return {
        'createDB': _memory.create,
        'CREATE_DATABASE': _memory.create,
        'dropDB': _memory.drop,
        'DROP_DATABASE': _memory.drop,
        'use': _memory.get,
        'USE': _memory.get,
        'show': _memory.show,
        'SHOW_DATABASES': _memory.show
    };

});