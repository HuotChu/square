/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['square', 'comparator', 'Select'], function (square, comparator, Select) {
    'use strict';

    var local = window.localStorage;

    var Table = function (db, tableName) {
        this.__proto__ = {
            '_db': db,
            '_event': db._event + '.' + tableName,
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

                return indices;
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

                return holes;
            }
        };

        return this;
    };

    var Column = function (table, columnName) {
        this._table = table;
        this._event = table._event + '.' + columnName;
        this._db = table._db;
    };

    Column.prototype = {
        'constructor': Column,
        '_event': '',
        '_db': undefined,
        'push': function (x) {
            var db = this._db.prototype;

            if (db.dispatch) {
                db.dispatch(this._event + '.add', {
                    value: x,
                    index: this.length - 1
                });
            }

            return Array.prototype.push.call(this, x);
        },
        'insert': function (x, ndx) {
            var exists = ndx in this,
                db = this._db.prototype;

            this[ndx] = x;
            if (db.dispatch) {
                db.dispatch(this._event + '.' + ndx + '.update', {
                    value: x,
                    index: ndx
                });
            }

            if (!exists && x !== null) {
                ++this.length;
            }
        }
    };

    Column.prototype.__proto__ = Array.prototype;

    var _memory = {},
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
            var db = new DB(dbName);

            db.prototype = db.__proto__;
            this[dbName] = db;

            return db;
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

    DB.__proto__ = {
        'constructor': DB,
        '_event': '',
        '_tableCount': 0,
        '_countUp': function () {
            var count = ++this._tableCount,
                db = this.prototype;

            if (db.dispatch) {
                db.dispatch(this._event + '.count.add', {
                    value: count
                });
            }
        },
        '_countDown': function () {
            var count = --this._tableCount,
                db = this.prototype;

            if (db.dispatch) {
                db.dispatch(this._event + '.count.delete', {
                    value: count
                });
            }
        },
        'count': function () {
            var count =  this._tableCount,
                db = this.prototype;

            if (db.dispatch) {
                db.dispatch(this._event + '.count.read', {
                    value: count
                });
            }
            return count;
        },
        'COUNT': function () {
            return this.count.call(this);
        },
        'select': function (/*selects*/) {
            var selects = getColumnNames.apply(null, arguments);

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

            if (db.prototype.dispatch) {
                db.prototype.dispatch(this._event + '.add', {
                    value: table
                });
            }

            this._countUp();

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
                    var cols = getColumnNames.apply(null, arguments),
                        col, i = 0, len = cols.length,
                        indices = table.indices(),
                        holes = table.holes(),
                        j = 0, jLen = indices.length,
                        newColumn, db = table._db.prototype;

                    for (i; i < len; ++i) {
                        col = cols[i];
                        newColumn = table[col] = new Column(table, col);
                        for (j = 0; j < jLen; ++j) {
                            newColumn.insert(undefined, indices[j]);
                        }
                        jLen = holes.length;
                        for (j = 0; j < jLen; ++j) {
                            newColumn.insert(null, holes[j]);
                        }
                        if (db.dispatch) {
                            db.dispatch(table._event + '.add', {
                                value: newColumn
                            });
                        }
                    }

                    return table;
                },
                'ADD': function (/*columns*/) {
                    return this.add.apply(this, arguments);
                },
                'drop': function (/*columns*/) {
                    var cols = getColumnNames.apply(null, arguments),
                        col, i = 0, len, db = table._db.prototype;

                    if (cols.length === 0 || cols[0] === '*') {
                        cols = table.columns();
                    }

                    for (len = cols.length; i < len; ++i) {
                        col = cols[i];
                        table[col] = null;
                        delete table[col];
                        if (db.dispatch) {
                            db.dispatch(table._event + '.delete', {
                                value: col
                            });
                        }
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
                    values = function (/*insertValues*/) {
                        var vals = Array.from(arguments),
                            column, columnName, val, i = 0, len = columns.length;

                        for (i; i < len; ++i) {
                            columnName = columns[i];
                            val = vals[i];
                            column = table[columnName];
                            column.push(val);
                        }

                        for (columnName in table) {
                            if (table.hasOwnProperty(columnName)) {
                                if (columns.indexOf(columnName) === -1) {
                                    // all columns in the table that did not get a value set should be set to undefined
                                    table[columnName].push(undefined);
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
        'insertJsonInto': function (tableName) {
            var table = this[tableName],
                db = this;

            return function (insertObjects /*[objects]*/) {
                var prop, insert, columnNames, add, vals,
                    i =0, len = insertObjects.length,
                    tableName = table._event.substr(table._event.indexOf('.') + 1),
                    insertToColumns = db.insertInto(tableName);

                for (i; i < len; ++i) {
                    insert = insertObjects[i];
                    columnNames = [];
                    vals = [];
                    for (prop in insert) {
                        if (insert.hasOwnProperty(prop)) {
                            if (!table[prop]) {
                                db.alterTable(tableName).add(prop);
                            }
                            columnNames.push(prop);
                            vals.push(insert[prop]);
                        }
                    }
                    add = insertToColumns.apply(null, columnNames);
                    add.values.apply(null, vals);
                }
            };
        },
        'INSERT_JSON_INTO': function (tableName) {
            this.insertJsonInto.call(this, tableName);
        },
        'update': function (tableName) {
            var table = this[tableName],
                db = table._db.prototype,
                updateMap = {},
                set = function (column, value) {
                    updateMap[column] = value;

                    return set;
                };

            set.WHERE = set.where = function (column, operator, control) {
                var w = new Where(table, column, operator, control);

                w.GO = w.go = function () {
                    var i = 0, len = this.validIndices.length, ndx, prop, val, crud = '.update' ;

                    for (i; i < len; ++i) {
                        ndx = this.validIndices[i];
                        for (prop in table) {
                            if (table.hasOwnProperty(prop) && updateMap[prop]) {
                                val = updateMap[prop];
                                table[prop][ndx] = val;
                                if (db.dispatch) {
                                    if (val === null) {
                                        crud = '.delete';
                                    }
                                    db.dispatch(table._event + '.' + prop + crud, {
                                        value: val,
                                        index: ndx
                                    });
                                }
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
                            column.insert(null, ndx);
                            if (db.prototype.dispatch) {
                                db.prototype.dispatch(column._event + '.' + ndx + '.delete', {
                                    value: null,
                                    index: ndx
                                });
                            }
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

    DB.prototype = DB.__proto__;

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