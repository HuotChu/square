define(['box'], function(Box) {
    'use strict';

    var boxConfig = {
        model: {},

        data: {},

        target: document.querySelector('#button-tutorial'),

        template: 'tutorial.html'
    };

    new Box(boxConfig);
});