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
        'select': function select (selectString) {
            return new Select(this, selectString || '*');
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
        'alterTable': function (tableName) {
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
                'modify': function modify () {
                    // only needed if I support data types on columns
                }
            }
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

                        return values;
                    }
                };
            };
        },
        'insertJSON': function insertJSON (insertObjects /*Array*/) {

        }

    };

    return {
        'createDB': _memory.create,
        'dropDB'  : _memory.drop,
        'getDB'   : _memory.get
    };

});