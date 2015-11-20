/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['temple'], function(temple) {
    'use strict';

    var buildABox = function (items, fragment) {
        var frag = fragment || document.createDocumentFragment(),
            data = items.data || frag.data || [],
            model = items.model || frag.model || [],
            target = items.target || frag.target || '',
            template = items.template || frag.template || '',
            templates = items.templates || frag.templates,
            domEvents = items.domEvents || frag.domEvents,
            modelEvents = items.modelEvents || frag.modelEvents;

        frag.data = data;
        frag.model = model;      // model to use for template transforms
        frag.destination = target;  // attach this view to 'destination' parent node
        frag.index = frag.index || {
            // key/value store where key = dom element 'data-index' and value is the element
            // todo: temple fills this in based on the template
        };
        frag.template = template;  // main template for temple to merge with the data
        frag.templates = templates || {
            // key/value store where key = dom element 'data-template' and value is the element
            // todo: temple fills this in based on the template
        };
        frag.domEvents = domEvents || [
            // key/value store where key = dom element 'alias' and value is an object:
            // {
            //     event: name of dom event
            //     callback: callback function
            //     context: apply to callback
            // }
        ];
        frag.modelEvents = modelEvents || [
            // key/value store where key = dom element 'alias' and value is
            // {
            //     event: name of model event
            //     callback: callback function
            //     context: apply to callback
            // }
        ];
        frag.vanish = function () {
            // destroy this fragment after removing all event handlers
        };
        frag.shed = function (/*elements*/) {
            // remove child element(s) and their event handlers
        };
        frag.build = function (config, frag) {
            var box = buildABox(config, frag);

            return temple.build(box);  // build returns a box (#documentFragment)
        };
        frag.parse = function (box) {
            return temple.build(box || this).outerHTML;  // parse returns html as string (after merging in model data)
        };

        return frag;
    };

    var Box = function (config) {
        var box = buildABox(config);

        this.view = temple.build(box);
    };

    Box.__proto__ = {
        view: undefined
    };

    Box.prototype = Box.__proto__;

    return Box;
});