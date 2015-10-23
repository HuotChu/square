/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(function() {
    'use strict';

    // Convenience Methods
    String.prototype.trim = function() {
        return this.replace(/^\s|\s$/g, '');
    };

    Object.prototype.nodeFromPath = function (path, create) {
        var paths = path.split('.'),
            prop = '',
            node = this;

        for (; paths.length > 0;) {
            prop = paths.shift();
            // do we have a node?
            if (node[prop]) {
                node = node[prop];
            } else if (create) {
                node[prop] = {};
                node = node[prop];
            } else {
                node = undefined;
                break;
            }
        }

        return node;
    };

    (function () {
        var isChromium = window.chrome,
            vendorName = window.navigator.vendor,
            isOpera = window.navigator.userAgent.indexOf("OPR") > -1,
            isIEedge = window.navigator.userAgent.indexOf("Edge") > -1;
        if (isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isOpera == false && isIEedge == false) {
            // browser is chrome
        } else {
            // not chrome, replace array.prototype.indexOf with faster method
            Array.prototype.indexOf = function (val) {
                var i = 0, len = this.length;
                for (i; i < len; ++i) {
                    if (this[i] === val) {
                        return i;
                    }
                }
                return -1;
            };
        }
    }());

    if (!Object.assign) {
        // Object.assign polyfill
        Object.defineProperty(Object, 'assign', {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function(target) {
                'use strict';
                if (target === undefined || target === null) {
                    throw new TypeError('Cannot convert first argument to object');
                }

                var to = Object(target);
                for (var i = 1; i < arguments.length; i++) {
                    var nextSource = arguments[i];
                    if (nextSource === undefined || nextSource === null) {
                        continue;
                    }
                    nextSource = Object(nextSource);

                    var keysArray = Object.keys(nextSource);
                    for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
                        var nextKey = keysArray[nextIndex];
                        var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                        if (desc !== undefined && desc.enumerable) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
                return to;
            }
        });
    }
});