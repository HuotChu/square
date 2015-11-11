/**
 * Copyright (c) 2015 Scott Bishop
 * SquareDB - www.squaredb.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['./comparator'], function (comparator) {
    'use strict';

    var go = function (queryObject) {
        var o = queryObject,
            table = o.table,
            distinct = o.distinct,
            selects = o.selects,
            where = o.where,
            len = selects.length || 1,
            returnArrays = {},
            response, i, j, jLen, columnName, column, initial,
            and, andi, or, ori, validIndices, newIndices, ndx;

        for (i = 0; i < len; ++i) {
            columnName = selects[i];
            // remove any quotes that were used to denote strings
            columnName = columnName.replace(/['"]/g, '');
            // is the column name wrapped in an aggregate?
            if (columnName.indexOf('(') !== -1) {
                columnName = columnName.replace(/^\w+\(([^\)]+)\)/, '$1');
            }
            // is this column aliased?
            if (columnName.indexOf(' as ') !== -1) {
                columnName = columnName.replace(/(^\w+)\sas\s\w+/, '$1');
            }
            if (columnName === '*') {
                selects = Object.keys(table);
                len = selects.length;
                columnName = selects[0];
            }
            column = table[columnName] || [];
            returnArrays[columnName] = column.filter(function (v) {
                return v !== null;
            });
        }

        if (where) {
            initial = where.initial;
            or = where.or;
            and = where.and;
            // process initial
            validIndices = comparator(table[initial[0]], initial[1], initial[2]);
            // process ORs
            if (or.length) {
                for (i = 0, len = or.length; i < len; ++i) {
                    ori = or[i];
                    newIndices = comparator(table[ori[0]], ori[1], ori[2]);
                    for (j = 0, jLen = newIndices.length; j < jLen; ++j) {
                        ndx = newIndices[j];
                        if (validIndices.indexOf(ndx) === -1) {
                            validIndices.push(ndx);
                        }
                    }
                }
            }
            // process ANDs
            if (and.length) {
                for (i = 0, len = and.length; i < len; ++i) {
                    andi = and[i];
                    newIndices = comparator(table[andi[0]], andi[1], andi[2]);
                    validIndices = validIndices.filter(function (v) {
                        return this.indexOf(v) !== -1;
                    }.bind(newIndices));
                }
            }

            // reduce columns to only validIndices
            returnArrays = makeValid(returnArrays, validIndices);
        }

        if (distinct) {
            validIndices = getDistinctIndices(returnArrays[distinct]);
            response = makeValid(returnArrays, validIndices);
        } else {
            response = returnArrays;
        }

        response = toJsonArray(response);

        return response;
    };

    var makeValid = function (returnArrays, validIndices) {
        var columnName;

        for (columnName in returnArrays) {
            if (returnArrays.hasOwnProperty(columnName)) {
                returnArrays[columnName] = returnArrays[columnName].filter(function (v, i) {
                    return validIndices.indexOf(i) !== -1;
                });
            }
        }

        return returnArrays;
    };

    var getDistinctIndices = function (a) {
        var cache = [], keep = [];

        a.filter(function (v, i) {
            if (cache.indexOf(v) === -1 && v !== null) {
                cache.push(v);
                keep.push(i);
                return true;
            }
        });

        return keep;
    };

    var toJsonArray = function (returnArrays) {
        var arr = [], columnName, column, len, i;

        for (columnName in returnArrays) {
            if (returnArrays.hasOwnProperty(columnName)) {
                column = returnArrays[columnName];
                len = column.length;
                for (i = 0; i < len; ++i) {
                    if (!arr[i]) {
                        arr[i] = {};
                    }
                    arr[i][columnName] = column[i];
                }
            }
        }

        return arr;
    };

    return go;
});