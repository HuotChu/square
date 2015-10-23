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
});