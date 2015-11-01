/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(function () {
    var _models = {},
        Model = {};

    Model.__proto__ = {
        _data: {},

        _callBacks: {},

        _modelName: '',

        // domDataNodes, _dataSpy, and update are used by the temple API for data binding
        domDataNodes: (function () {
            var obj = {};

            obj.__proto__ = {
                // Todo: add destroy method to dataNodes?
                getNode: function (sPath) {
                    var path = sPath.split('.'),
                        node = path.shift(),
                        currentNode = this[node];

                    for (; path.length > 0;) {
                        node = path.shift();
                        currentNode = (currentNode.node || currentNode)[node];
                    }

                    return currentNode ? currentNode.node : undefined;
                },

                setNode: function (sPath, el) {
                    // todo: create an object from path method in a util.js
                    var path = sPath.split('.'),
                        node = path.shift(),
                        currentNode = this.getNode(node);

                    if (!currentNode) {
                        this[node] = {};
                        currentNode = this[node];
                    }

                    for (; path.length > 0;) {
                        node = path.shift();
                        currentNode = currentNode[node] || currentNode;
                        if (!currentNode[node]) {
                            currentNode[node] = {};
                            currentNode = currentNode[node];
                        }
                    }

                    el.domDataParent = currentNode;
                    currentNode.node = el;

                    return currentNode.node;
                },

                removeNode: function (el) {
                    el.domDataParent = null;
                }
            };

            return obj;
        }()),

        _dataSpy: {
            'add'   : {},
            'remove': {},
            'update': {},
            'change': {}
        },

        _update: function (updateEvent, dataPath, changedVal) {
            var e = this._dataSpy[updateEvent][dataPath] || [],
                changed = this._dataSpy.change[dataPath] || [],
                notify = function (watcher) {
                    var domNode = watcher.get('node'),
                        callBack = this._callBacks[watcher.get('callBack')],
                        react = watcher.get('react'),
                        target, attr;

                    if (callBack && callBack.function) {
                        callBack.function.call(domNode, changedVal, updateEvent, dataPath.replace(/_/g, '.'), this);
                    }
                    if (react) {
                        // TODO: Make this much better - experimental atm
                        react = react.split(':');
                        target = react[0];
                        attr = react[1] || '';

                        if (attr && attr === 'length') {
                            changedVal = this.getNodeFromPath(domNode.getAttribute('data-spy')).length;
                        }

                        switch (target) {
                            case 'checked':
                                if (changedVal.get && changedVal.get(attr)) {
                                    domNode.checked = 'checked';
                                } else {
                                    domNode.removeAttribute('checked');
                                }
                                break;
                            case 'html':
                                domNode.innerHTML = changedVal;
                                break;
                            case 'style':
                                domNode.className = changedVal;
                                break;
                            default:
                                if (domNode) {
                                    domNode.value = changedVal;
                                }
                        }
                    }
                }.bind(this);

            if (e.length && updateEvent !== 'change') {
                e.forEach(notify);
            }

            if (changed.length) {
                changed.forEach(notify);
            }
        },

        /**
         * create spawns a new model with the given name and properties
         * @param modelName {String} Unique name for this model (or overwrite existing model with this name)
         * @param propsObj [Object] Optional properties/methods to append to the model
         * @returns {Object} Returns the newly created model instance
         */
        create: function (modelName, propsObj) {
            var model = _models[modelName] = Object.create(Model.__proto__),
                prop;

            model.__proto__._modelName = modelName;

            for (prop in propsObj) {
                if (propsObj.hasOwnProperty(prop)) {
                    model[prop] = propsObj[prop];
                }
            }

            return model;
        },

        add: function (id, path, val, prop) {
            var node,
                parent = this.getNodeFromPath(path),
                valType = this.getDataType(val),
                parentType = this.getDataType(parent);

            if (prop === '!') {
                valType = 'frozen';
            }

            if (valType === 'array') {
                node = this.newDataArray(id, path);
                node.cloneArray(val);
            } else if (valType === 'object') {
                node = this.newDataObject(id, path);
                node.set(val, prop);
            } else if (parentType === 'dataArray') {
                parent.add(val);
            } else if (parentType === 'dataObject') {
                parent.set(val, prop);
            }

            if (node.dataArray) {
                node.add(val);
            } else if (node.dataObject) {
                node.set(val, prop);
            }

            return node;
        },

        remove: function (path, comp, args) {
            var root = this.getNodeFromPath(path),
                target = root.query(comp, args),
                targetNdx = target.foundAt;

            root.splice(targetNdx, 1);
        },

        /**
         * getModel get the model with a given name
         * @param modelName {String} Name of model to get
         * @returns {Object|null} Returns the requested model or null if it doesn't exist
         */
        getModel: function (modelName) {
            return _models[modelName];
        },

        /**
         * getNodeFromPath returns a node from the model at a given path
         * @param path {String} Path to node to retrieve | '_data' to get back the root data node
         * @param modelName [String] Optional name of model to get | defaults to current model
         * @returns {Object|null} Returns the requested node or null if not found
         */
        getNodeFromPath: function (path, modelName) {
            // todo: cache these lookups by concat path name
            var model = this.getModel(modelName || this._modelName),
                i, len, nodePath, nodeId, node = {};

            if (path !== undefined && path !== null) {
                nodePath = path.split('.');
                for (i = 0, len = nodePath.length; i < len && node !== undefined; ++i) {
                    nodeId = nodePath[i];
                    if (i === 0) {
                        if (nodeId === '') {
                            node = model._data;
                        } else {
                            node = model._data[nodeId];
                        }
                    } else {
                        node = node[nodeId];
                    }
                }
            } else {
                node = undefined;
            }

            return node;
        },

        getDataType: function (val) {
            return val.dataArray ? 'dataArray' : val.dataObject ? 'dataObject' : val instanceof Array
                   ? 'array' : val === null || (typeof val === 'number' && isNaN(val)) || val === undefined
                   ? 'undefined' : typeof val;
        },

        newDataObject: function (nodeName, path, modelName) {
            var model = this.getModel(modelName || this._modelName),
                parentNode = this.getNodeFromPath(path, modelName),
                dataObject = Object.create(Object.prototype, {
                    'data': {
                        value: undefined,
                        enumerable: true,
                        writable: true,
                        configurable: false
                    },
                    'get': {
                        value: function (prop) {
                            return this.data[prop] || this[prop];
                        },
                        enumerable: false,
                        writable: false,
                        configurable: false
                    },
                    'set': {
                        value: function (val, prop) {
                            var e;

                            if (prop) {
                                this.data[prop] = val;
                            } else {
                                this.data = val;
                            }

                            if (!this._initialized) {
                                this._initialized = true;
                                e = 'add';
                            } else {
                                e = 'update';
                            }

                            if (nodeName) {
                                model._update(e, (path ? path + '.' : '') + nodeName + (prop ? '.' + prop : ''), val);
                            }

                            return this;
                        },
                        enumerable: false,
                        writable: false,
                        configurable: false
                    },
                    'getNodeFromPath': {
                        value: function (path) {
                            return this._model.getNodeFromPath(path);
                        },
                        enumerable: false,
                        writable: false,
                        configurable: false
                    },
                    'dataObject' : {
                        value: true,
                        enumerable: false,
                        writable: false,
                        configurable: false
                    },
                    '_initialized': {
                        value: false,
                        enumerable: false,
                        writable: true,
                        configurable: false
                    }
                });

            dataObject.__proto__._model = this;

            if (path !== undefined && path !== null) {
                parentNode[nodeName] = dataObject;
            }

            return dataObject;
        },

        newDataArray: function (arrayName, path, modelName) {
            var model = this.getModel(modelName || this._modelName),
                parentNode = this.getNodeFromPath(path, modelName),
                compMap = {
                    isEqual: function (config) {
                        var prop = config[0],
                            expected = config[1];

                        return function (o) {
                            var comp,
                                type = typeof o;

                            if (type === 'object') {
                                comp = o.data[prop] == expected ? o : false;
                            } else {
                                comp = o.data == expected ? o : false;
                            }

                            return comp;
                        }
                    },
                    notEqual: function (config) {
                        var prop = config[0],
                            expected = config[1];

                        return function (o) {
                            var comp,
                                type = typeof o;

                            if (type === 'object') {
                                comp = o[prop] != expected ? o : false;
                            } else {
                                comp = o != expected ? o : false;
                            }

                            return comp;
                        }
                    }
                },
                dataArray = Object.create(Array.prototype, {
                    'dataArray': {
                        value: true,
                        enumerable: false,
                        writable: false,
                        configurable: false
                    },
                    '_initialized': {
                        value: false,
                        enumerable: false,
                        writable: true,
                        configurable: false
                    },
                    '_update': {
                        value: function (val, evt) {
                            var e = evt;

                            if (!this._initialized) {
                                this._initialized = true;
                            } else {
                                e = e === 'add' ? 'update' : e;
                            }

                            if (arrayName) {
                                model._update(e, (path ? path + '.' : '') + arrayName, val);
                            }
                        },
                        enumerable: false,
                        writable: false,
                        configurable: false
                    },
                    'add': {
                        value: function (val) {
                            if (val && typeof val === 'object' && val instanceof Function === false) {
                                if (val instanceof Array && !val.dataArray) {
                                    val = this._model.newDataArray().cloneArray(val);
                                } else if (!val.dataObject) {
                                    val = this._model.newDataObject().set(val);
                                }
                            }

                            this.push(val);
                            this._update(val, 'add');

                            return this;
                        },
                        enumerable: false,
                        writable: false,
                        configurable: false
                    },
                    'remove': {
                        // TODO: support remove multiple using the query multiple flag
                        value: function (comp, args) {
                            var found = this.query(comp, args),
                                removeIndex = found.foundAt;

                            found = this.splice(removeIndex, 1);
                            this._update(found, 'remove');

                            return found;
                        },
                        enumerable: false,
                        writable: false,
                        configurable: false
                    },
                    'cutFirst': {
                        value: function () {
                            var rtn = this.shift();

                            this._update(rtn, 'remove');

                            return rtn;
                        },
                        enumerable: false,
                        writable: false,
                        configurable: false
                    },
                    'cutLast': {
                        value: function () {
                            var rtn = this.pop();

                            this._update(rtn, 'remove');

                            return rtn;
                        },
                        enumerable: false,
                        writable: false,
                        configurable: false
                    },
                    'cloneArray': {
                        value: function (inputArr) {
                            var i = 0,
                                len = inputArr.length,
                                dataObj,
                                val;

                            this.length = 0;

                            for (i; i < len; ++i) {
                                val = inputArr[i];
                                dataObj = model.newDataObject();
                                dataObj.set(val);
                                this.push(dataObj);
                            }

                            if (path && arrayName) {
                                this._update(this, 'add');
                            }

                            return this;
                        },
                        enumerable: false,
                        writable: false,
                        configurable: false
                    },
                    'query': {
                        value: function (compFunc, config, multiple) {
                            var found = multiple ? [] : false,
                                f, o = {};

                            if (typeof compFunc === 'string' && (f = compMap[compFunc])) {
                                f = f(config);
                            }

                            if (f) {
                                if (multiple) {
                                    this.forEach(function (obj, ndx) {
                                        var newObj = f(obj);

                                        if (newObj !== false) {
                                            o.found = newObj;
                                            o.foundAt = ndx;
                                            found.push(o);
                                        }
                                    });
                                } else {
                                    this.some(function (obj, ndx) {
                                        var newObj = f(obj);

                                        if (newObj !== false) {
                                            o.found = newObj;
                                            o.foundAt = ndx;
                                        }

                                        return o.found;
                                    });
                                }
                            }

                            if (!o.found ) {
                                o = null;
                            }

                            if (multiple && !found.length) {
                                found = null;
                            }

                            return o || found;
                        },
                        enumerable: false,
                        writable: false,
                        configurable: false
                    },
                    'getNodeFromPath': {
                        value: function (path) {
                            model.getNodeFromPath(path);
                        },
                        enumerable: false,
                        writable: false,
                        configurable: false
                    }
                });

            dataArray.__proto__._model = this;

            if (path !== undefined && path !== null) {
                parentNode[arrayName] = dataArray;
            }

            return dataArray;
        },

        /**
         * register add a named callback to a matching data-event-listener and fire on the desired dom event
         * @param name {String} Name of callback (should match data-event-listener value)
         * @param event {String} Event to bind to
         * @param listener {Function} Callback function to execute on event
         * @param modelName [String] Name of model to use or current model
         * @returns {*} Returns the current model
         */
        register: function (name, event, listener, modelName) {
            var model = this.getModel(modelName || this._modelName);

            model._callBacks[name] = {
                "event": event,
                "function": listener
            };

            return model;
        },

        spy: function (name, func) {
            this.register(name, 'modelEvent', func);
        }
    };

    return Model;
});