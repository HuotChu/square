define(function () {
    var _models = {},
        Model = function () {};

    Model.prototype = {
        data: [],
        _callBacks: {},
        create: function (modelName, propsObj) {
            _models[modelName] = Object.create(new Model(), propsObj);

            return _models[modelName];
        },
        getModel: function (modelName) {
            return _models[modelName];
        },
        insert: function (topicName, data, config, modelName) {
            var model = this.getModel(modelName) || this,
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
                }
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