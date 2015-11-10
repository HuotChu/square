/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['./go'], function (go) {
    'use strict';

    var QueryObject = function (selects) {
        this.selects = selects;
    };

    QueryObject.prototype = {
        'distinct': false,
        'selects': [],
        'table': undefined,
        'db': undefined,
        'where': []
    };

    var Where = function (queryObject, column, comparator, control) {
        this._queryObject = queryObject;
        queryObject.where = {
            'initial': [column, comparator, control],
            'and': [],
            'or': []
        };
    };

    Where.prototype = {
        'and': function (column, comparator, control) {
            this._queryObject.where.and.push([column, comparator, control]);

            return this;
        },
        'or': function (column, comparator, control) {
            this._queryObject.where.or.push([column, comparator, control]);

            return this;
        },
        'go': function () {
            return go(this._queryObject/*, callBackFunc*/);
        },
        'GO': function () {
            return go(this._queryObject/*, callBackFunc*/);
        }
    };

    var where = function (column, comparator, control) {
        return new Where(this._queryObject, column, comparator, control);
    };

    var From = function (queryObject, tableName) {
        this._queryObject = queryObject;
        this._table = queryObject.db[tableName];
        queryObject.table = this._table;
    };

    var from = function (tableName) {
        return new From(this._queryObject, tableName);
    };

    From.prototype = {
        '_table': undefined,
        'where': function () {
            return where.apply(this, arguments);
        },
        'WHERE': function () {
            return where.apply(this, arguments);
        },
        'go': function () {
            return go(this._queryObject/*, callBackFunc*/);
        },
        'GO': function () {
            return go(this._queryObject/*, callBackFunc*/);
        }
    };

    var distinct = function distinct (columnName) {
        var select = new Select(columnName);

        select._queryObject.distinct = true;

        return select;
    };

    var Select = function (db, selects) {
        this._queryObject = new QueryObject(selects);
        this._queryObject.db = db;

        return this;
    };

    Select.prototype = {
        '_queryObject': {},
        'from': function () {
            return from.apply(this, arguments);
        },
        'FROM': function () {
            return from.apply(this, arguments);
        },
        'distinct': distinct,
        'DISTINCT': distinct
    };

    return Select;
});