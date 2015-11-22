/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define([], function() {
    'use strict';

    var lo = window.localStorage;

    // Save table to localStorage
    var put = function (table) {
        var json;

        try {
            json = JSON.stringify(table);
            if (json) {
                lo.setItem(table._event, json);
            }
        } catch  (err) {
            console.log(err);
        }
    };

    // Save entire db to localStorage
    var persist = function (db) {
        var table;

        for (table in db) {
            if (db.hasOwnProperty(table)) {
                put(table);
            }
        }
    };

    // Get model data from localStorage
    var sync = function (dbName) {
        var store = lo.getItem(dbName),
            reg = new RegExp('^' + dbName + '\\.[\\w\\-_\\.]+'),
            key;

        if (!store) {
            // individual tables have been stored (default)
            store = {};
            store[dbName] = {};
            store = store[dbName];

            for (key in lo) {
                if (lo.hasOwnProperty(key)) {
                    if (reg.test(key)) {
                        store[key] = JSON.parse(lo[key]);
                    }
                }
            }
        } else {
            store = JSON.parse(store);
        }

        return store;
    };

    // Get a table from local storage
    var get = function (name) {
        var table = lo.getItem(name);

        if (table) {
            table = JSON.parse(table);
        }

        return table;
    };

    // ToDo: Respond to localStorage change event to update the model?
    return {
        get: get,
        persist: persist,
        put: put,
        sync: sync
    }
});
