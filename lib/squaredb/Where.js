/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define([], function () {
    'use strict';

    var Where = function (column, comperator, control, table) {
        this._table = table;
        this._matches = this._test(column, comperator, control);
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