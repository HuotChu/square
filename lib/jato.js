/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(function() {
    'use strict';

    // create some new javaScript Object types :)
    var DataObj = window.DataObject = function DataObject () {
        this.value = {};
    };

    DataObj.prototype = {
        '_name': '',
        '_initialized': false,
        '_model': undefined,
        '_indexFields': [],      // {Array} property name(s) within the value object that should be indexed by the model
        'setIndex': function (propName) {
            if (this._indexFields.indexOf(propName) === -1) {
                return this._indexFields.push(propName);
            }
        },
        'dropIndex': function (propName) {
            var found = this._indexFields.indexOf(propName);

            if (found > -1) {
                return this._indexFields.splice(found, 1);
            }
        },
        'get': function (prop, preventExecution) {
            var result = prop ? this.nodeFromPath(prop, false) : this.value;

            if (typeof result === 'function' && !preventExecution) {
                result = result(this);
            }

            return result;
        },
        'set': function (val, prop, preventDispatch) {
            var detail = {},
                path = '',
                model = this._model,
                name = (this._name.length ? this._name + '.' : '') + (prop || 'dataObjectChange');

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
                if (model && model.dispatch) {
                    // parents name their children to accomplish bubbling
                    // this._name == <path to this dataObject> == modelName.parentCollectionName
                    model.dispatch(name, detail);
                }
            }

            return name; // {String} Event name to attach listeners to for changes in the property we just set
        },
        'nodeFromPath': function (path, create) {
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
        },
        'constructor': DataObj
    };

    // TODO: create setMany method => accepts an object and translates property/values into set calls

    //Object.assign(DataObj.prototype, {});

});