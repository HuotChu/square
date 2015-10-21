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
        'event': '',
        '_initialized': false,
        '_model': undefined,
        '_indexFields': [],      // {Array} property name(s) within the value object that should be indexed by the model
        'constructor': DataObj,
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
        // TODO: create setMany method => accepts an object and translates property/values into set calls
        'set': function (val, prop, preventDispatch) {
            var detail = {},
                path = '',
                model = this._model,
                event = (this.event.length ? this.event + '.' : '') + (prop || 'dataChange');

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
                    model.dispatch(event, detail);
                }
            }

            return this;
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
        }
    };

    var DataCollection = window.DataCollection = function DataCollection () {};

    DataCollection.prototype = {
        'event': '',
        '_initialized': false,
        '_valid': {},
        '_model': undefined,
        'constructor': DataCollection,
        'add': function (dataObj) {  //todo: accept an array or create new method for array of data
            var detail,
                event = this.event,
                model = this._model,
                childEvent = new Date().getTime();

            if (!(dataObj instanceof DataObject)) {
                dataObj = new DataObject().set(dataObj, false, true);
            }

            dataObj._model = model;
            dataObj.event = event + '.' + childEvent;
            detail = {
                'target': this,
                'type': 'add',
                'value': dataObj
            };

            this.push(dataObj);

            if (model && model.dispatch) {
                model.dispatch(event, detail);
            }

            return dataObj.event; // this is the event name to listen to for changes in this DataObject
        },
        'drop': function (ndx) {
            var removed = this.splice(ndx, 1)[0],
                model = this._model,
                detail = {
                    'target': this,
                    'type': 'drop',
                    'value': removed
                };

            if (model) {
                if (model.dispatch) {
                    model.dispatch(this.event, detail);
                }
                if (model.garbageCollect) {
                    // remove all event handlers for this Object
                    model.garbageCollect(removed);
                }
            }

            return removed;  // removed DataObject
        },
        // Query Method
        /*
         * o should be an object with the following properties:
         * (select and from are required, the rest are optional)
         * {
         *     'select':   // *** <column selection> list of property names to return values for or * all columns
         *     'from':     // *** table(s) to retrieve data from    <= this is the current object <DataCollection>
         *     'distinct': // true or false (default)
         *     'join':     // type of join to perform
         *     'where':    // condition to eliminate unwanted data
         *     'group':    // column name(s) to group by?
         *     'having':   // condition to filter return from 'group'
         *     'order':    // column to sort on and sort direction/algorithm
         * }
         */
        'query': function (queryObj) {
            var select = queryObj['select'] || [],   // fields to return, i.e. return ['author', 'shipping.weight']
                distinct = !!queryObj['distinct'],
                join = queryObj['join'],
                where = queryObj['where'] || [],
                group = queryObj['group'],
                having = queryObj['having'],
                order = queryObj['order'],
                results = new DataCollection();


        }
    };

    DataCollection.prototype.__proto__ = Array.prototype;
});