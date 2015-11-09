/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['./Where'], function (Where) {
    'use strict';

    var From = function (db, tableName) {
        this._table = db[tableName];
    };

    From.prototype = {
        '_table': undefined,
        'where': new Where()
    };

    return From;
});