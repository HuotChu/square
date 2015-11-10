/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['../square', './aggregates', './Select', './tableObjects'], function (square, aggregates, Select, tableObjects) {
    'use strict';

    var Table = tableObjects.Table,
        Column = tableObjects.Column,
        _memory = {},
        getColumnNames = function getColumnNames (/*columns*/) {
            var columnNames = Array.from(arguments);

            if (columnNames.length === 1 && columnNames[0].indexOf(',') !== -1) {
                columnNames = columnNames[0].split(',').map(function (el) {
                    return el.trim();
                });
            }

            return columnNames;
        };

    _memory.__proto__ = {
        'create': function create (dbName) {
            //this[dbName] = eventHub.connect(new DB(dbName));
            this[dbName] = new DB(dbName);

            return this[dbName];
        },
        'drop': function drop (dbName) {
            if (this[dbName]) {
                this[dbName] = null;
                delete this[dbName];

                return true;
            }

            return false;
        },
        'get': function get (dbName) {
            return this[dbName];
        },
        'show': function show () {
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
        'count': function count () {
            return this._tableCount;
        },
        'COUNT': function COUNT () {
            return this._tableCount;
        },
        'select': function select (/*selects*/) {
            var selects = getColumnNames.apply({}, arguments);

            return new Select(this, selects);
        },
        'SELECT': function SELECT (/*selects*/) {
            return this.select.apply(this, arguments);
        },
        'createTable': function createTable (tableName) {
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
        'CREATE_TABLE': function CREATE_TABLE (tableName) {
            return this.createTable.call(this, tableName);
        },
        'alterTable': function alterTable (tableName) {
            var table = this[tableName];

            return {
                'add': function add (/*columns*/) {
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
                'ADD': function VALUES (/*columns*/) {
                    return this.add.apply(this, arguments);
                },
                'drop': function drop (/*columns*/) {
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
                'DROP': function VALUES (/*columns*/) {
                    return this.drop.apply(this, arguments);
                },
                'modify': function modify () {
                    // only needed if I support data types on columns
                }
            }
        },
        'ALTER_TABLE': function ALTER_TABLE (tableName) {
            return this.alterTable.call(this, tableName);
        },
        'insertInto': function insertInto (tableName) {
            var table = this[tableName];

            return function (/*columns*/) {
                var columns = getColumnNames.apply({}, arguments);

                return {
                    'values': function values (/*insertValues*/) {
                        var values = Array.from(arguments),
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

                        return this;
                    },
                    'VALUES': function VALUES (/*insertValues*/) {
                        return this.values.apply(this, arguments);
                    }
                };
            };
        },
        'INSERT_INTO': function INSERT_INTO (tableName) {
            return this.insertInto.call(this, tableName);
        },
        'insertJSON': function insertJSON (insertObjects /*Array*/) {

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