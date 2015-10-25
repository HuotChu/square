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
             * createTable adds a new Table Object <tableName> to the DB Object
             *             dispatches a 'tableName' event for any event listeners
             * @param {String} tableName Name to assign to the new table
             * @returns {Function} Returns a curried function waiting for the columns argument
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
                var curriedSelect = function () {
                        return curriedSelect._return;
                    },
                    table = this.db[tableName],
                    returnObj = {},
                    returnArray = [],
                    returnClone,
                    columns = this.columns[0] === '*' ? Object.keys(table) : this.columns,
                    column = columns[0],
                    selected = table[column],
                    selectedVal = undefined,
                    i = 0, j,
                    iLen = selected.length,
                    jLen = columns.length;

                for (i; i < iLen; ++i) {
                    selectedVal = selected[i];
                    if (selectedVal !== null) { // skip holes, these are 'dead indices'
                        returnObj[column] = selectedVal;
                        for (j = 1; j < jLen; ++j) {
                            column = columns[j];
                            selected = table[column];
                            returnObj[column] = selected[i];
                        }
                        returnArray.push(returnObj);
                        column = columns[0];
                        selected = table[column];
                        returnObj = {};
                    }
                }

                // don't return the actual data array or it could get mucked with
                returnClone = Array.from(returnArray);

                curriedSelect.__proto__ = {
                    'where': function (column, comperator, control) {
                        var where = curriedWhere(column, comperator, control, this.table);

                        return this.results.filter(where);
                    }.bind({
                        'results': returnClone,
                        'table': table
                    }),
                    '_return': returnClone
                }

                return curriedSelect;
            }.bind({
                'db': this,
                'columns': Array.from(arguments)
            });

            return {
                'from': fromFunc
            }
        },
        insertInto: function (tableName) {
            return function (/*columns*/) {
                var insertValues = function (/*values*/) {
                    var table = this.table,
                        columns = Array.from(this.columns),
                        values = Array.from(arguments),
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
                                        // perform copy and return table or wtf do I return here???
                                    }
                                }
                            }
                        }
                    }
                };
            }.bind(this[tableName]);
        },
        update: function (tableName) {
            var table = this[tableName],
                updateMap = {},
                set = function (column, value) {
                    updateMap[column] = value;

                    return set;
                };

            set.where = function (column, comperator, control) {
                var where = curriedWhere(column, comperator, control, table),
                    col = table[column];

                col.forEach(where);

                curriedWhere.matches.forEach(function(i) {
                    var prop;

                    for (prop in table) {
                        if (table.hasOwnProperty(prop) && updateMap[prop]) {
                            table[prop][i] = updateMap[prop];
                        }
                    }
                });
            };

            return {
                'set': set
            }
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

    var curriedWhere = function (column, comperator, control, table) {
        var matches = [],
            firstPeriod = control.indexOf('.'),
            secondPeriod = control.lastIndexOf('.'),
            startsWith = firstPeriod !== 0,
            endsWith = secondPeriod !== control.length - 1;

        curriedWhere.matches = matches;

        if (comperator === 'like' || comperator === 'not like') {
            if (startsWith) {
                control = '^' + control;
            }
            if (endsWith) {
                control += '$';
            }
        }

        return function (row, i) {
            var field = row[column] || table[column][i],
                found = false,
                regX;

            if (field) {
                regX = new RegExp(control, 'i');
                switch (comperator) {
                    case '==':
                        found = field == control;
                        break;
                    case '===':
                        found = field === control;
                        break;
                    case '>':
                        found = field > control;
                        break;
                    case '<':
                        found = field < control;
                        break;
                    case '>=':
                        found = field >= control;
                        break;
                    case '<=':
                        found = field <= control;
                        break;
                    case '!=':
                        found = field != control;
                        break;
                    case '!==':
                        found = field !== control;
                        break;
                    case 'like':
                        found = regX.test(field);
                        break;
                    case 'not like':
                        found = !regX.test(field);
                        break;
                    default:
                        found = false;
                }
            }

            if (found) {
                matches.push(i);
            }

            return found;
        }
    };

    curriedWhere.matches = [];

    return {
        'createDB': _memory.create,
        'dropDB'  : _memory.drop,
        'getDB'   : _memory.get
    };
});