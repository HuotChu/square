define(['notify'], function (notify) {
    var _models = {},
        Model = function () {};

    Model.prototype = {
        data: [],
        _callBacks: {},
        create: function (modelName, propsObj) {
            _models[modelName] = Object.create(new Model(), propsObj);
            _models[modelName].modelName = modelName;

            return _models[modelName];
        },

        getModel: function (modelName) {
            return _models[modelName];
        },

        insert: function (topicName, data, config, modelName) {
            var model = this.getModel(modelName || this.modelName),
                topic = model[topicName] || [],
                dataObj,
                newObj,
                i = 0,
                len,
                prop,
                map;

            if (data instanceof Array) {
                for (i, len = data.length; i < len; ++i) {
                    dataObj = data[i];
                    newObj = {};

                    for (prop in dataObj) {
                        if (dataObj.hasOwnProperty(prop)) {
                            map = (config && config[prop]) ? config[prop] : prop;
                            newObj[map] = dataObj[prop];
                        }
                    }

                    topic.push(newObj);
                }

                model[topicName] = topic;
            }

            return model;
        },

        update: function (path, newVal, customEventName, modelName) {
            var name = modelName || this.modelName,
                model = this.getModel(name),
                targetNodes = path.split('.'),
                firstNode = targetNodes.shift(),
                topic = model[firstNode] || [],
                target = targetNodes.shift(),
                targetNode,
                i = 0,
                len = targetNodes.length,
                updateEvent;

            for (i; i < len; ++i) {
                targetNode = targetNodes[i];
                topic = topic[targetNode];
            }

            if (topic instanceof Array) {
                topic = topic[0];
            }

            topic[target] = newVal;

            updateEvent = name + (customEventName || '') + '?path=' + path;

            notify.publish(updateEvent);
        },

        /**
         * getData returns the value of an object path lookup in the model
         * @param path {String} Path through object to desired data
         * @param modelName [String] Name of model to use (or current model)
         * @returns {*} Returns the found value or null if no value is found
         */
        getData: function (path, modelName) {
            var name = modelName || this.modelName,
                model = this.getModel(name),
                targetNodes = path.split('.'),
                node = targetNodes.shift(),
                topic = model[node] || [],
                returnVal;

            for (; targetNodes.length > 1; node = targetNodes.shift()) {
                topic = topic[node];
            }

            if (topic instanceof Array) {
                topic = topic[0];
            }

            returnVal = topic[node];

            if (returnVal === 'undefined') {
                returnVal = null;
            }

            return returnVal;
        },

        /**
         * select returns an object from a data topic array if it matches the compFunc
         * @param topicName {String} Name of a data topic array
         * @param compFunc {Function} Test object property values against a comparator !Function must return either the passing object or boolean false
         * @param modelName [String] Name of model to use (or current model)
         * @returns {boolean|Object} Returns the found object or boolean false
         */
        select: function (topicName, compFunc, modelName) {
            var model = this.getModel(modelName) || this,
                topic = model[topicName] || [],
                found = false;

            topic.some(function (obj) {
                found = compFunc(obj);

                return found;
            });

            if (found instanceof Object) {
                found.$get = function (key) {
                    return found[key];
                };
            }

            return found;
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
            var model = this.getModel(modelName) || this;

            model._callBacks[name] = {
                "event": event,
                "function": listener
            };

            return model;
        }
    };

    return new Model();
});