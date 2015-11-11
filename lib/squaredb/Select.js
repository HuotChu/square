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
        'db': undefined,
        'distinct': false,
        'selects': [],
        'table': undefined,
        'where': undefined
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
            return go(this._queryObject);
        },
        'GO': function () {
            return go(this._queryObject);
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
            return go(this._queryObject);
        },
        'GO': function () {
            return go(this._queryObject);
        }
    };

    var distinct = function (columnName) {
        var db = this._queryObject.db;

        this._queryObject = new QueryObject([columnName]);
        this._queryObject.distinct = columnName;
        this._queryObject.db = db;

        return this;
    };

    var Select = function (db, selects) {
        this._queryObject = new QueryObject(selects || '*');
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
        'distinct': function (/*columnNames*/) {
            return distinct.apply(this, arguments);
        },
        'DISTINCT': function (/*columnNames*/) {
            return distinct.apply(this, arguments);
        }
    };

    return Select;
});