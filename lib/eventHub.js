/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(function() {
    'use strict';

    var createEventNode = function () {
           return document.createElement('object');
    };

    var customEvent = function (eventName, detail, cancel, exposeAll) {
        return new CustomEvent(eventName, {'cancelable': !!cancel, 'detail': exposeAll ? exposeDetail(detail) : detail});
    };

    var exposeDetail = function (o) {
        // expose all properties of a CustomEvent.detail to content scripts
        'use strict';
        var no = {__exposedProps__: {}},
            val, prop;

        for (prop in o) {
            if (o.hasOwnProperty(prop)) {
                val = o[prop];
                no[prop] = val;
                no.__exposedProps__[prop] = val;
            }
        }

        return no;
    };

    var watchers = {};

    var callBacks = {};

    var dispatch = function (eventName, detail, bubbles, cancel, exposeAll) {
        var hub = this.eventNode,
            crud = '',
            path = eventName.replace(/(\.\w{4,6})$/i, function (match, capture) {
                // capture = one of: create|read|update|delete
                crud = capture;

                return '';
            }),
            fireEvents = function () {
                hub.dispatchEvent(customEvent(path + crud, detail, cancel, exposeAll));
                if (crud !== '.read') {
                    hub.dispatchEvent(customEvent(path + '.change', detail, cancel, exposeAll));
                } else {
                    hub.dispatchEvent(customEvent(path + '.all', detail, cancel, exposeAll));
                }
            };

        detail = detail || {};
        detail.origin = eventName;
        fireEvents();

        if (bubbles !== false) {
            // "I don't think that word means what you think it means..."
            // there is no DOM to bubble up or down, so bubbling here involves parent nodes in the model
            // paths 'bubble up' to parent nodes denoted by the eventName
            // detail.bubbles tells listeners this event bubbles and where it originated [eventName]
            while (true) {
                path = path.split('.');
                detail.lastNode = path.pop();
                if (!path.length) {
                    break;
                }
                path = path.join('.');
                fireEvents();
            }
        }

        return true;
    };

    var addListener = function (eventName, callBack, currentTarget) {
        var watchers = this.watchers,
            eventArray = watchers[eventName],
            listener;

        if (currentTarget) {
            callBack = callBack.bind(currentTarget);
        }

        if (!eventArray) {
            eventArray = watchers[eventName] = [];
        }

        listener = this.eventNode.addEventListener(eventName, callBack, false);

        eventArray.push(listener);

        return listener;
    };

    var removeListener = function (listener) {
        return this.eventNode.removeEventListener(listener);
    };

    var garbageCollect = function (deadObject) {
        var event = deadObject.event,
            watchers = this.watchers,
            watcherArray = watchers[event],
            watcher,
            i = 0,
            len;

        if (event && watcherArray) {
            // remove all event handlers for this Object
            for (i, len = watcherArray.length; i < len; ++i) {
                watcher = watcherArray[i];
                this.removeListener(watcher);
            }

            watchers[event] = null;
            delete watchers[event];
        }
    };

    var connect = function (o) {
        var newO, proto = o.__proto__;

        newO = Object.create(proto);
        Object.assign(newO.__proto__, hub);
        newO.__proto__.eventNode = createEventNode();

        return newO;
    };

    var hub = {
        'connect': connect,
        'callBacks': callBacks,
        'watchers': watchers,
        'dispatch': dispatch,
        'addListener': addListener,
        'removeListener': removeListener,
        'garbageCollect': garbageCollect
    };

    return hub;
});
