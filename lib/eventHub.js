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
                var e = new CustomEvent(eventName, {'bubbles': bubbles == undefined ? true : !!bubbles, 'cancelable': !!cancel, 'detail': exposeAll ? this.exposeDetail(detail) : detail});

                this._eventHub.dispatchEvent(e);
                // If the eventHub dispatches the event, e.target will be null
                // to circumvent this pass the target in using the detail argument, then retrieve via e.detail.target

                return true;
            },
            // TODO: Name the listeners so we can remove them later when needed
            addListener: function (eventName, callBack) {
                this._eventHub.addEventListener(eventName, callBack, false);

                return true;
            }
        };
    };

    return {
        connect: function (o) {
            Object.assign(o, EventHub());
        }
    };

});