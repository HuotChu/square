/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['./eventHub'], function(eventHub) {
    'use strict';

    var model = {}; // stub for model

    eventHub.connect(model);

    // create some new javaScript Object types :)
    var DataObj = window.DataObject = function DataObject () {
        this.value = undefined;
        this._model = undefined;
    };

    DataObj.prototype._initialized = false;

    DataObj.prototype.nodeFromPath = function (path, create) {
        var paths = path.split('.'),
            prop = '',
            node = this.value,
            cache = this;

        for (; paths.length > 0;) {
            prop = paths.shift();
            // do we have a node?
            if (node && node[prop]) {
                node = node[prop];
            } else if (create) {
                if (cache instanceof DataObject) {
                    cache.set({}, prop, false);
                    node = cache.value[prop];
                } else {
                    cache[prop] = {};
                    node = cache[prop];
                }
                cache = node;
            }
        }

        return node;
    };

    DataObj.prototype.get = function (prop, preventExecution) {
        var result = prop ? this.nodeFromPath(prop, false) : this.value;

        if (typeof result === 'function' && !preventExecution) {
            result = result(this);
        }

        return result;
    };

    // TODO: create setMany method => accepts an object and translates property/values into set calls
    DataObj.prototype.set = function (val, prop, preventDispatch) {
        var detail = {},
            path = '';

        if (prop) {
            if (prop.indexOf('.') !== -1) {
                path = prop.split('.');
                path.pop();
                path = path.join('.');
                this.nodeFromPath(path, true)[prop] = val;
            } else {
                if (this.value === undefined) {
                    this.value = {};
                }
                this.value[prop] = val;
            }
        } else {
            this.value = val;
        }

        if (!this._initialized) {
            this._initialized = true;
            detail.type = 'add';
        } else {
            detail.type = 'update';
        }

        detail.value = val;
        detail.target = prop ? this[prop] : this;


        if (preventDispatch !== false) {
            // TODO: replace model2 stub with actual model
            // if (this._model)
            model.dispatch(prop || 'modelUpdate', detail);
        }

        return this.get(prop);
    };

    Object.assign(DataObj.prototype, {});

    DataObj.prototype.constructor = DataObj;

    // define special storage types: dataArray, dataObject, dataCollection, dataModel
/*    var dataModel = function (mixins) {
        var model = Object.create({
            isDataModel: true,
            modelName: '',
            from: function (tableName) {
                return this[tableName];
            },
            add: function (tableName, data) {
                if (this[tableName]) {
                    // throw an error and return something (the error?)
                } else {

                }
            }
        }, mixins);
    };*/

    var _storage = {
        /*
           'amazon': {    // model or DB name
             'books': {   // collection or table name
                'j$_validate': {    // dataObjects within the 'books' collection will use these to validate
                    'book-id': /[\d\w\-]+/i,
                    'book-title': /[\w\d\-_\s'\.\?!&]{2,60}/i,
                    'book-price': /^\$\d{1,9}\.\d{2}$/i
                },
                    // the data structure looks like this... or it can be further nested in [sub] collections
                    // unique keys are automatically generated for a plain array of objects
                'CF10239843-fr987': {   // SQLish dataObject => SQL primary key val or Object name
                    'data': {
                        'book-id': 'CF10239843-fr987',    // SQL row name or Object property
                        'book-title': 'One Flew Over the Cuckoo\'s Nest',
                        'book-price': '$15.00'
                    }
                },
                '555-abc-12-us54323': {
                    'data': {
                        'book-id': '555-abc-12-us54323',
                        'book-title': 'Tommy Knockers',
                        'book-price': '$29.95'
                    }
                },
                'KF0009878US': {
                    'data': {
                        'book-id': 'KF0009878US',
                        'book-title': 'One Fish Two Fish Red Fish Blue Fish',
                        'book-price': '$29.95'
                    }
                },
                'j$_objectArray': [   // dataArray created by SQLish! => pointers to the objects above
                    {CF10239843-fr987}, {555-abc-12-us54323}, {KF0009878US}
                ]
             }
           }
        */
    };

    return {model: model, model2: model2};
});