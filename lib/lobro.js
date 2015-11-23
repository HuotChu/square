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
    var persist = function (db) {
        var table,
            o = {
                backup: true
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

        lobro.enableEvents = {
            enumerable: false,
            configurable: false,
            writable: false,
            value: enableEvents
        };

        newO = Object.create(o, lobro);

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

    var lobro =  {
        'clear': {
            writable: false,
            configurable: false,
            enumerable: false,
            value: clear
        },
        'getLocal': {
            writable: false,
            configurable: false,
            enumerable: false,
            value: getLocal
        },
        'putLocal': {
            writable: false,
            configurable: false,
            enumerable: false,
            value: putLocal
        },
        'persist': {
            writable: false,
            configurable: false,
            enumerable: false,
            value: persist
        },
        'remove': {
            writable: false,
            configurable: false,
            enumerable: false,
            value: remove
        },
        'sync': {
            writable: false,
            configurable: false,
            enumerable: false,
            value: sync
        },
        'connect': {
            writable: false,
            configurable: false,
            enumerable: false,
            value: connect
        }
    };

    return {
        connect: connect,
        clear: clear,
        getLocal: getLocal,
        putLocal: putLocal,
        persist: persist,
        remove: remove,
        sync: sync
    };
});
