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
            return function (/*rows*/) {
                var db = this.db,
                    rows = Array.prototype.slice.call(arguments),
                    path = db._event,
                    table = new Table(rows),
                    detail;

                table.__proto__._db = db;
                table.__proto__._event = path + '.' + this.tableName;
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
        'select': function (/*fields*/) {
            var fromFunc = function (tableName) {
                var table = this.db[tableName],
                    returnObj = {},
                    returnArray = [],
                    selects = this.selects,
                    select = selects.shift(),
                    selected = table[select],
                    selectedVal = undefined,
                    i = 0, j = 0,
                    iLen = selected.length,
                    jLen = selects.length;

                for (i; i < iLen; ++i) {
                    selectedVal = selected[i];
                    if (selectedVal !== null) { // skip holes, these are 'dead indices'
                        returnObj[select] = selectedVal;
                        for (j = 0; j < jLen; ++j) {
                            select = selects[j];
                            selected = table[select];
                            returnObj[select] = selected[i];
                        }
                        returnArray.push(returnObj);
                        returnObj = {};
                    }
                }

                return returnArray;
            }.bind({
                'db': this,
                'selects': Array.prototype.slice.call(arguments)
            });

            return {
                'from': fromFunc
            }
        },
        insertInto: function (tableName) {
            var table = this[tableName];

            return function (/*fields*/) {
                var insertValues = function (/*values*/) {
                    var table = this.table,
                        fields = this.fields,
                        values = Array.prototype.slice.call(arguments),
                        fillIndex = t[0].length,
                        targetIndex = -1,
                        prop = '',
                        i = 0;

                    for (prop in table) {
                        if (table.hasOwnProperty(prop)) {
                            targetIndex = fields.indexOf(prop);
                            if (targetIndex > -1) {
                                table[prop].push(values.splice(targetIndex, 1));
                                fields.splice(targetIndex, 1);
                            } else {
                                table[prop].push(undefined);
                            }
                        }
                    }

                    return table;
                }.bind({
                    'table': this,
                    'fields': Array.prototype.slice.call(arguments)
                });

                return {
                    'values': insertValues
                };
            }.bind(table);
        }
    };

    var Table = function (rows) {
        var row, rowName, i = 0, len;

        rows = rows !== undefined ? rows instanceof Array ? rows : [rows] : [];
        for (len = rows.length; i < len; ++i) {
            rowName = rows[i];
            row = new Row();
            row.__proto__._db = this._db;
            row.__proto__._event = this._event + '.' + rowName;
            this[rowName] = row;
            // todo: dispatch update
        }
    };

    Table.prototype = {
        'constructor': Table,
        '_event': '',
        '_db': undefined
    };

    var Row = function () {
        var __super = this.__proto__.__proto__;

        this.push = function (x) {
            // todo: dispatch update/add
            __super.push.call(this, x);
        };
    };

    Row.prototype = {
        'constructor': Row,
        '_event': '',
        '_db': undefined
    };

    Row.prototype.__proto__ = Array.prototype;

    return {
        'createDB': _memory.create,
        'dropDB'  : _memory.drop,
        'getDB'   : _memory.get
    };
});