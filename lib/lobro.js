/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define([], function() {
    'use strict';

    var lo = window.localStorage;

    // Save table to localStorage
    var putLocal = function (table) {
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

    // Remove from localStorage
    var remove = function (name) {
        lo.removeItem(name);
    };

    // Save entire db to localStorage
    var persist = function (db, version) {
        var table,
            o = {
                version: version || 1
            };

        Object.defineProperty(o, '_event', {
            enumerable: false,
            value: db._event
        });

        for (table in db) {
            if (db.hasOwnProperty(table)) {
                putLocal(db[table]);
            }
        }
        // save the DB name as a key in local storage, so we can easily check for existence of backup
        putLocal(o);
    };

    // Get model data from localStorage
    var sync = function (dbName) {
        var store = {},
            reg = new RegExp('^' + dbName + '\\.[\\w\\-_\\.]+'),
            key;

        store[dbName] = {};
        store = store[dbName];

        for (key in lo) {
            if (lo.hasOwnProperty(key)) {
                if (reg.test(key)) {
                    store[key] = JSON.parse(lo[key]);
                }
            }
        }

        return this.restore ? this.restore(store, dbName) : store;
    };

    var connect = function (o) {
        var newO,
            proto = o.__proto__,
            addListener = function () {
                newO.addListener(newO._event + '.change', function (event) {
                    var origin = event.detail.origin,
                        reg = new RegExp('^' + newO._event +'\\.([^\\.]+)', 'i'),
                        table = origin.match(reg);

                    table = table && table[1];

                    if (table && typeof table === 'string' && /create|read|update|delete/.test(table) === false) {
                        newO.putLocal(newO[table]);
                    }
                }, newO);
            },
            enableEvents = '',
            loadingPromise = new Promise(function (resolve) {
                enableEvents = resolve;
            });

        newO = Object.create(proto);
        Object.assign(newO.__proto__, lobro);
        newO.__proto__.enableEvents = enableEvents;

        if (newO.dispatch) {
            loadingPromise.then(function () {
                addListener();
            });
        }

        return newO;
    };

    // Get a table from local storage
    var getLocal = function (name) {
        var table = lo.getItem(name);

        if (table) {
            table = JSON.parse(table);
        }

        return table;
    };

    var clear = function () {
        lo.clear();

        return lo;
    };

    var isCurrent = function (dbName, version) {
        var exists = getLocal(dbName);

        return exists && exists.version === version;
    };

    var lobro =   {
        connect: connect,
        isCurrent: isCurrent,
        clearLocal: clear,
        getLocal: getLocal,
        putLocal: putLocal,
        persist: persist,
        removeLocal: remove,
        sync: sync
    };

    return lobro;
});
