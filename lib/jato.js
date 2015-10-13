/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(function() {
    'use strict';

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
            path = '',
            model = this._model;

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
            if (model && model.dispatch) {
                model.dispatch(prop || 'modelUpdate', detail);
            }

        }

        return this.get(prop);
    };

    Object.assign(DataObj.prototype, {});

    DataObj.prototype.constructor = DataObj;
});