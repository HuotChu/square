define(function () {
    var _models = {},
        Model = {};

    Model.__proto__ = {
        _data: {},

        _callBacks: {},

        _modelName: '',

        _topics: {},

        _update: function () {},

        dataBind: function () {},

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

        add: function (path, obj) {
            if (!obj.dataObject) {
                obj = this.newDataObject().set(obj);
            }
            this.getNodeFromPath(path).push(obj);

            //this._update('new-' + path.join('.'), obj);

            return obj;
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
            return _models[modelName] || null;
        },

        /**
         * getNodeFromPath returns a node from the model at a given path
         * @param path {String} Path to node to retrieve | '_data' to get back the root data node
         * @param modelName [String] Optional name of model to get | defaults to current model
         * @returns {Object|null} Returns the requested node or null if not found
         */
        getNodeFromPath: function (path, modelName) {
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

            return node !== undefined ? node : null;
        },

        newDataObject: function (nodeName, path, modelName) {
            var parentNode = this.getNodeFromPath(path, modelName),
                dataObject = Object.create(Object.prototype, {
                    'data': {
                        value: undefined,
                        enumerable: true,
                        writable: true,
                        configurable: false
                    },
                    'get': {
                        value: function (prop) {
                            return this.data[prop] || this.data;
                        },
                        writable: false,
                        configurable: false
                    },
                    'set': {
                        value: function (val, prop) {
                            if (prop) {
                                this.data[prop] = val;
                            } else {
                                this.data = val;
                            }

                            return this;
                        },
                        writable: false,
                        configurable: false
                    },
                    'dataObject' : {
                        value: true,
                        writable: false,
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
                        enumerable: true,
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

                            return this;
                        },
                        enumerable: true,
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
                        enumerable: true,
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
         * register a callback to attach to matching data-event-listeners in html
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
        }
    };

    return Model;
});