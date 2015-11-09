/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define([], function () {
    'use strict';

    var Where = function (queryObject, column, comparator, control) {
        this._table = table;
        // todo: change this...
        this._matches = this._test(column, comparator, control);
    };

    Where.prototype = {
        '_table': undefined,
        '_matches': [],
        'and': function () {

        },
        'or': function () {

        }
    };

    return Where;
});