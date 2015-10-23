/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['./eventHub'], function(eventHub) {
    'use strict';

    var _memory = {};

    _memory.__proto__ = {
        'create': function (dbName) {
            this[dbName] = eventHub.connect(new DB(dbName));

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
        this.__proto__._event = dbName;
    };

    DB.prototype = {
        'constructor': DB,
        '_event': '',
        'createTable': function (tableName) {
            /**
             * create adds a new Table Object named tableName to the DB Object
             *        dispatches a 'tableName' event for any event listeners
             * @param tableName {String} Name to assign to the new table
             * @returns {TableObject} Returns a new Table(tableName)
             */
            return function (/*columns*/) {
                var db = this.db,
                    columns = Array.prototype.slice.call(arguments),
                    path = db._event,
                    table = new Table(columns, db, path + '.' + this.tableName),
                    detail;

                db[tableName] = table;
                detail = {
                    'target': this,
                    'type': 'Create',
                    'value': table
                };
                // todo: unlock dispatch
                //this.dispatch(path, detail);
                return table;
            }.bind({
                'db': this,
                'tableName': tableName
            });
        },
        'drop': function (tableName) {
            if (this[tableName]) {
                this[tableName] = null;
                delete this[tableName];
                return true;
            }
        },
        'select': function (/*columns*/) {
            var fromFunc = function (tableName) {
                var table = this.db[tableName],
                    returnObj = {},
                    returnArray = [],
                    columns = this.columns,
                    column = columns.shift(),
                    selected = table[column],
                    selectedVal = undefined,
                    i = 0, j = 0,
                    iLen = selected.length,
                    jLen = columns.length;

                for (i; i < iLen; ++i) {
                    selectedVal = selected[i];
                    if (selectedVal !== null) { // skip holes, these are 'dead indices'
                        returnObj[column] = selectedVal;
                        for (j = 0; j < jLen; ++j) {
                            column = columns[j];
                            selected = table[column];
                            returnObj[column] = selected[i];
                        }
                        returnArray.push(returnObj);
                        returnObj = {};
                    }
                }

                return {
                    'where': function (/*conditions*/) {
                        // where code
                    }.bind(returnArray),
                    'return': returnArray
                };
            }.bind({
                'db': this,
                'columns': Array.prototype.slice.call(arguments)
            });

            return {
                'from': fromFunc
            }
        },
        insertInto: function (tableName) {
            var table = this[tableName];

            return function (/*columns*/) {
                var insertValues = function (/*values*/) {
                    var table = this.table,
                        columns = Array.prototype.slice.call(this.columns),
                        values = Array.prototype.slice.call(arguments),
                        targetIndex = -1,
                        prop = '';

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

                    return insertValues.bind({'table': table, 'columns': this.columns});
                    //return table;
                }.bind({
                    'table': this,
                    'columns': Array.prototype.slice.call(arguments)
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
                                        // return table or wtf do I return here???
                                    }
                                }
                            }
                        }
                    }
                };
            }.bind(table);
        }
    };

    var Table = function (columns, db, eventName) {
        var column, columnName, i = 0, len;

        this.__proto__._db = db;
        this.__proto__._event = eventName;

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

    Table.prototype = {
        'constructor': Table,
        '_event': '',
        '_db': undefined
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

    return {
        'createDB': _memory.create,
        'dropDB'  : _memory.drop,
        'getDB'   : _memory.get
    };
});