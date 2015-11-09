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

    Select.prototype = {
        '_queryObject': {},
        'from': new From(),
        'FROM': new From(),
        'distinct': distinct,
        'DISTINCT': distinct
    };

    return Select;
});