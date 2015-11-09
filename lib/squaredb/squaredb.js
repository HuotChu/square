/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['../square', './aggregates', './Select', './tableObjects'], function (square, aggregates, Select, tableObjects) {
    'use strict';

    var Table = tableObjects.Table,
        Column = tableObjects.Column,
        _memory = {};

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
            var db = this,
                table = new Table(db, tableName);

            db[tableName] = table;
            ++db._tableCount;

            return function (/*columns*/) {
                var columns = Array.from(arguments);

                if (columns.length) {
                    this.alterTable(tableName).add.apply(this, arguments);
                }

                return table;
            };
        },
        'alterTable': function (tableName) {
            var table = this[tableName],
                db = this;

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
                        table[col] = new Column();
                        newColumn = table[col];
                        newColumn.prototype._db = db;
                        newColumn.prototype._event = table._event + '.' + col;
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
        }
    };

    return {
        'createDB': _memory.create,
        'dropDB'  : _memory.drop,
        'getDB'   : _memory.get
    };

});