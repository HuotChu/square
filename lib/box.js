/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['temple'], function(temple) {
    'use strict';

    return function (items) {
        var frag = new DocumentFragment(),
            data = items.data,
            model = items.model,
            dest = items.destination,
            template = items.template,
            domEvents = items.domEvents,
            modelEvents = items.modelEvents;

        frag.data = data || [];
        frag.model = model || [];      // model to use for template transforms
        frag.destination = dest || '';  // attach this view to 'destination' parent node
        frag.index = {
            // key/value store where key = dom element 'alias' and value is the element
            // todo: temple fills this in based on the template
        };
        frag.template = template || '';
        // todo: figure out if I want to do this
      /*  frag.templates = templates || {
            // templateId: 'templateName.html'
            // _merge: target dom node to attach this box as a child (optional)
                _build: [

                    // array of build instructions...
                    // 'parse(template2).insert(template1 as foo).name(view1).go()',
                    // 'build(template3).insert(view1).name(view2).go()',
                    // 'return view2'
                ]
        };*/
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
        frag.build = function () {
            return temple.build(this);  // build returns html as DOM
        };
        frag.parse = function () {
            return temple.build(this).outerHTML;  // parse returns html as string (after merging in model data)
        };

        return frag;
    };
});