define(function () {
    var _models = {},
        Model = {};

    Model.__proto__ = {
        _data: {
            // _data can be arranged by topics. This allows a single model to represent one or several groupings of data
            // Each topic is a named object whose properties may be any number of dataArrays, dataObjects, or sub-topics
            // Each subtopic is the same thing as a topic; all topics are indexed for quick lookup using model.getTopic(topicName)
            // Alternatively, dataArrays and dataObjects may be appended directly to the root of the model without topics
            //
            // i.e. (Sample Structure under _data), also note the following assertions based on the data:
            //      _data.reminders.isDataArray === true
            //      _data.user.isTopicNode === true
            //      _data.user.lists.isDataArray === true
            //      _data.user.name.isDataObject === true
            //      _data.user.sessions-today.isDataNode === true
            //      _data.user.uid.isDataObject === undefined (false)
            //
            // reminders: [{title:'Wash Car', done:false}, {title:'Walk Dog', done:true}]
            // user: {
            //     lists: [
            //       {id:'Monday', completed:1, total:2},
            //       {id:'Tuesday', completed:0, total:3}
            //     ],
            //     settings: [
            //       {id:'login', auto:true},
            //       {id:'theme', color:'blue', font:'Verdana', font-size:'18'}
            //     ],
            //     name: {data: 'Scott'},
            //     uid:  'blujagu',
            //     sessions-today: {data: ['1443207183821', '1443209204520']}
            // }
            //
        },

        _callBacks: {},

        _modelName: '',

        _topics: {},

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

        getTopic: function (topicId, modelName) {
            var model = this.getModel(modelName || this._modelName);

            return model._topics[topicId];
        },

        /**
         * newTopic creates a topicNode and returns it. If a path is provided, the topic is added to the model
         * @param lookupName [String] Name to index this topic under (must be unique)
         * @param topicName [String] Name of new topicNode node to create on model
         * @param path [String] Path to parent node where this topic should be created
         * @param modelName [String] Optional name of model to get | defaults to current model
         * @returns {Object|null} Returns the requested node or null if not found
         */
        newTopic: function (lookupName, topicName, path, modelName) {
            var parentNode = this.getNodeFromPath(path, modelName),
                topicObj = Object.create(Object.prototype, {
                    'topicName': {
                        value: '',
                        writable: true,
                        configurable: false
                    },
                    'isTopicNode' : {
                        value: true,
                        enumerable: true,
                        writable: false,
                        configurable: false
                    },
                    'get': {
                        value: function (path) {
                            var parts = path.split('.'),
                                i = 0, len = parts.length,
                                part, obj = {};

                            for (i; i < len; ++i) {
                                part = parts[i];
                                if (i === 0) {
                                    obj = part ? this[part] : this;
                                } else {
                                    obj = obj[part];
                                }
                            }

                            return obj.data || obj;
                        },
                        enumerable: true,
                        writable: false,
                        configurable: false
                    },
                    'setVal':  {
                        value: function (prop, val) {
                            var dataObject = this.newDataObject();

                            dataObject.data.value = val;
                            this[prop] = dataObject;

                            return dataObject;
                        },
                        enumerable: true,
                        writable: false,
                        configurable: false
                    },
                    'setData': {
                        value: function (prop, dArray) {
                            var dataArray = this.newDataArray();

                            return dataArray.cloneArray(dArray);
                        },
                        enumerable: true,
                        writable: false,
                        configurable: false
                    },
                    'setTopic': {
                        value: function (prop) {
                            this[prop] = this.newTopic(prop);

                            return this[prop];
                        },
                        enumerable: true,
                        writable: false,
                        configurable: false
                    }
                });

            lookupName = lookupName || 'topic_' + Date.now();
            this.topicName.value = lookupName;
            this._topics[lookupName] = topicObj;
            if (path !== undefined && path !== null) {
                parentNode[topicName] = topicObj;
            }

            return topicObj;
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

                            return val;
                        },
                        writable: false,
                        configurable: false
                    },
                    'isDataObject' : {
                        value: true,
                        writable: false,
                        configurable: false
                    }
                });

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
                                comp = o.data[prop] === expected ? o : false;
                            } else {
                                comp = o.data === expected ? o : false;
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
                                comp = o[prop] !== expected ? o : false;
                            } else {
                                comp = o !== expected ? o : false;
                            }

                            return comp;
                        }
                    }
                },
                dataArray = Object.create(Array.prototype, {
                    'isDataArray': {
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
                                f;

                            if (typeof compFunc === 'string' && (f = compMap[compFunc])) {
                                f = f(config);
                            }

                            if (f) {
                                if (multiple) {
                                    this.forEach(function (obj) {
                                        if (f(obj) !== false) {
                                            found.push(obj);
                                        }
                                    });
                                } else {
                                    this.some(function (obj) {
                                        found = f(obj);

                                        return found;
                                    });
                                }
                            }

                            if (!found || (multiple && !found.length)) {
                                found = null;
                            }

                            return found;
                        },
                        enumerable: true,
                        writable: false,
                        configurable: false
                    }
                });

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