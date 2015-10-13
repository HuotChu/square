/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(function() {
    'use strict';

    var EventHub = function () {
        return {
            _eventHub: document.createElement('object'),
            _event: function (eventName, detail, cancel, exposeAll) {
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
                var _event = this._event,
                    hub = this._eventHub,
                    path = eventName;

                hub.dispatchEvent(_event(path, detail, cancel, exposeAll));

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
                        hub.dispatchEvent(_event(path, detail, cancel, exposeAll));
                    }
                }

                return true;
            },
            addListener: function (eventName, callBack, currentTarget) {
                if (currentTarget) {
                    callBack = callBack.bind(currentTarget);
                }

                return this._eventHub.addEventListener(eventName, callBack, false);
            },
            removeListener: function (listener) {
                return this._eventHub.removeEventListener(listener);
            }
        };
    };

    return {
        connect: function (o) {
            Object.assign(o, EventHub());
        }
    };

});