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
                    table = new Table(columns, db, path + '.' + this.tableName);

                db[tableName] = table;

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
                return true;
            }
        },
        'select': function (/*columns*/) {
            var db = this,
                columns = Array.from(arguments),
                _from = function (distinct, cols) {
                    return function (tableName) {
                        // this is select.FROM <table>
                        var table = db[tableName],
                            buildReturnArray = function () {
                                var returnObj = {}, returnArray = [],
                                    column, selected, selectedVal,
                                    i, j, iLen, jLen, cache = [],
                                    returnColumns = cols || columns;

                                if (!returnColumns || returnColumns[0] === '*') {
                                    returnColumns = Object.keys(table);
                                }

                                column = returnColumns[0];
                                selected = table[column] || [];
                                iLen = selected.length;
                                jLen = returnColumns.length;

                                for (i = 0; i < iLen; ++i) {
                                    selectedVal = selected[i];
                                    if (selectedVal !== null) { // skip holes, these are 'dead indices'
                                        returnObj[column] = selectedVal;
                                        for (j = 1; j < jLen; ++j) {
                                            column = returnColumns[j];
                                            selected = table[column];
                                            returnObj[column] = selected[i];
                                        }
                                        returnArray.push(returnObj);
                                        column = returnColumns[0];
                                        selected = table[column];
                                        returnObj = {};
                                    }
                                }

                                return returnArray;
                            },
                            go = function (matchesArray) {
                                var result = buildReturnArray();

                                result = result.filter(function (row, i) {
                                    return matchesArray.indexOf(i) !== -1;
                                });

                                return result;
                            };
                        // end FROM vars

                        return {
                            'where': function (column, comparator, control) {
                                var where = createWhere(column, comparator, control, table, distinct);

                                where.go = where._go(go);

                                return where;
                            },
                            'go': function () {
                                return buildReturnArray();
                            }
                        };
                        // end FROM return
                    };
                    // end _from return
                };
            // end 'select' vars

            return {
                'distinct': function (/*columns*/) {
                    var select = _from(true, Array.from(arguments));

                    select.from = select;

                    return select;
                },
                'from': _from(false)
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

    var wherePrototype = function () {
        return {
            'distinct': false,
            'matches': [],
            'cache': [],
            'lastTable': undefined,
            'match': function (column, comperator, control, sourceTable, distinct) {
                var firstPeriod = control.indexOf('.'),
                    secondPeriod = control.lastIndexOf('.'),
                    startsWith = firstPeriod !== 0,
                    endsWith = secondPeriod !== control.length - 1,
                    table = sourceTable || this.lastTable,
                    db = table._db,
                    tableName = table._event.substr(table._event.lastIndexOf('.') + 1),
                    col = db[tableName][column] || [];

                this.distinct = !!distinct;
                this.lastTable = table;
                this.cache = [];

                if (comperator === 'like' || comperator === 'not like') {
                    if (startsWith) {
                        control = '^' + control;
                    }
                    if (endsWith) {
                        control += '$';
                    }
                }

                col.filter(this._filter(table[column], comperator, control));

                return this.matches;
                },
                '_reset': function () {
                    this.distinct = false;
                    this.matches = [];
                    this.cache = [];
                    this.lastTable = undefined;
                    this.go = function () {}
                },
                '_go': function (f) {
                    return function () {
                        return f(this.matches);
                    };
                },
                'go': function () {},
                'and': function (column, comperator, control) {
                    var oldMatches = Array.from(this.matches),
                        andWhere = createWhere(column, comperator, control, this.lastTable, this.distinct),
                        newMatches = andWhere.matches;

                    this.matches = oldMatches.filter(function (match) {
                        return newMatches.indexOf(match) !== -1;
                    });

                    return this;
                },
                'or': function (column, comperator, control) {
                var oldMatches = Array.from(this.matches),
                    orWhere = createWhere(column, comperator, control, this.lastTable, this.distinct),
                    newMatches = orWhere.matches;

                oldMatches.forEach(function (match) {
                    if (newMatches.indexOf(match) === -1) {
                        newMatches.push(match);
                    }
                });

                this.matches = newMatches;

                return this;
            },
            '_filter': function (column, comperator, control) {
                return function (row, i) {
                    var val = column[i],
                        found = false,
                        inMatches,
                        regX;

                    if (val) {
                        switch (comperator) {
                            case '==':
                                found = val == control;
                                break;
                            case '===':
                                found = val === control;
                                break;
                            case '>':
                                found = val > control;
                                break;
                            case '<':
                                found = val < control;
                                break;
                            case '>=':
                                found = val >= control;
                                break;
                            case '<=':
                                found = val <= control;
                                break;
                            case '!=':
                                found = val != control;
                                break;
                            case '!==':
                                found = val !== control;
                                break;
                            case 'like':
                                regX = new RegExp(control, 'i');
                                found = regX.test(val);
                                break;
                            case 'not like':
                                regX = new RegExp(control, 'i');
                                found = !regX.test(val);
                                break;
                            default:
                                found = false;
                        }
                    }

                    inMatches = this.matches.indexOf(i) > -1; // if already in matches, don't add it again...

                    if (found && !inMatches) {
                        if (this.distinct && this.cache.indexOf(val) === -1) {
                            this.cache.push(val);
                            this.matches.push(i);
                        } else if (!this.distinct) {
                            this.matches.push(i);
                        }
                    }

                    return found;
                }.bind(this);
            }
        };
    };

    var createWhere = function (column, comperator, control, sourceTable, distinct) {
        var where = Object.create(wherePrototype(), {});

        where.match(column, comperator, control, sourceTable, distinct);

        return where;
    };

    return {
        'createDB': _memory.create,
        'dropDB'  : _memory.drop,
        'getDB'   : _memory.get
    };
});