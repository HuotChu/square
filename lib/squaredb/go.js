/**
 * Copyright (c) 2015 Scott Bishop
 * SquareDB - www.squaredb.com
 * MIT License (MIT) - This header must remain intact.
 **/
define([], function () {
    'use strict';

    var go = function go (queryObject, callBack, context) {
        console.log('queryObject', queryObject);
        // use the query object to query the DB
        // extract properties...
        var o = queryObject,
            db = o.db,
            table = o.table,
            distinct = o.distinct,
            selects = o.selects,
            where = o.where,
            i = 0,
            len = selects.length || 1,
            returnArrays = {},
            columnName, column;

        for (i; i < len; ++i) {
            columnName = selects[i];
            if (columnName === undefined || columnName === '*') {
                selects = Object.keys(table);
                len = selects.length;
                columnName = selects[0];
            }
            column = table[columnName];
            // todo: pick up here...
        }

        return queryObject;
    };

    return go;
});