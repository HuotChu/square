/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['./Where'], function (Where) {
    'use strict';

    var where = function (column, comparator, control) {
        return new Where(this._queryObject, column, comparator, control);
    };

    var From = function (queryObject, tableName) {
        this._table = db[tableName];
        this._queryObject = queryObject;
        queryObject.table = this._table;
    };

    From.prototype = {
        '_table': undefined,
        'where': where.bind(this),
        'WHERE': where.bind(this)
    };

    return From;
});