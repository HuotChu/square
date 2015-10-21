/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(function() {
    'use strict';

    var EventHub = function () {
        return {
            eventHub: document.createElement('object'),
            watchers: {},
            customEvent: function (eventName, detail, cancel, exposeAll) {
                return new CustomEvent(eventName, {'cancelable': !!cancel, 'detail': exposeAll ? this.exposeDetail(detail) : detail});
            },
            exposeDetail: function (o) {
                // call to expose all properties of a CustomEvent.detail to content scripts
                'use strict';
                var no = {__exposedProps__: {}},
                    val;

                for (let prop in o) {
                    if (o.hasOwnProperty(prop)) {
                        val = o[prop];
                        no[prop] = val;
                        no.__exposedProps__[prop] = val;
                    }
                }

                return no;
            },
            dispatch: function (eventName, detail, bubbles, cancel, exposeAll) {
                var event = this.customEvent,
                    hub = this.eventHub,
                    path = eventName;

                hub.dispatchEvent(event(path, detail, cancel, exposeAll));

                if (bubbles !== false) {
                    // "I don't think that word means what you think it means..."
                    // there is no DOM to bubble up or down, so bubbling here involves parent nodes in the model
                    // paths 'bubble up' to parent nodes denoted by the eventName
                    // detail.bubbles tells listeners this event bubbles and where it originated [eventName]
                    detail = detail || {};
                    detail.bubbles = eventName;

                    while (true) {
                        path = path.split('.');
                        path.pop();
                        if (!path.length) {
                            break;
                        }
                        path = path.join('.');
                        hub.dispatchEvent(event(path, detail, cancel, exposeAll));
                    }
                }

                return true;
            },
            addListener: function (eventName, callBack, currentTarget) {
                var watchers = this.watchers,
                    eventArray = watchers[eventName],
                    listener;

                if (currentTarget) {
                    callBack = callBack.bind(currentTarget);
                }

                if (!eventArray) {
                    eventArray = watchers[eventName] = [];
                }

                listener = this.eventHub.addEventListener(eventName, callBack, false);

                eventArray.push(listener);

                return listener;
            },
            removeListener: function (listener) {
                return this.eventHub.removeEventListener(listener);
            },
            garbageCollect: function (deadObject) {
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
            }
        };
    };

    return {
        connect: function (o) {
            Object.assign(o, EventHub());

            return o;
        }
    };

});