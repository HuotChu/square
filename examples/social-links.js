define(['box'], function(Box) {
    'use strict';

    var boxConfig = {
        model: {},

        data: {},

        target: document.querySelector('#social-links'),

        template: '../social-links.html'
    };

    new Box(boxConfig);
});