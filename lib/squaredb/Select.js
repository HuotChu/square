/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['./From'], function (From) {
    'use strict';

    var QueryObject = function (selects) {
        this.selects = selects;
    };

    QueryObject.prototype = {
        'distinct': false,
        'selects': [],
        'table': undefined,
        'db': undefined
    };

    var distinct = function distinct (columnName) {
        var select = new Select(columnName);

        select._queryObject.distinct = true;

        return select;
    };

    var Select = function (db, selectString) {
        var selects = selectString.split(',').map(function (el) {
            return el.trim();
        });

        this._queryObject = new QueryObject(selects);
        this._queryObject.db = db;
    };

    var from = function (tableName) {
        return new From(this._queryObject, tableName);
    };

    Select.prototype = {
        '_queryObject': {},
        'from': from.bind(this),
        'FROM': from.bind(this),
        'distinct': distinct,
        'DISTINCT': distinct
    };

    return Select;
});