/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com & www.squarejs.com
 * MIT License (MIT) - This header must remain intact.
 **/
define([], function() {
    'use strict';

    var _re1 = /\{\{([\w\-\.]*)\}\}/mig;

    var _re2 = /\{\{\+([\w\-\.]+)\}\}/mig;

    var templateSignature = /<\s*(\w+)[^>]+data-template="([^"]+)"(?:[^\/]*>.*[\r\n\w\W]*?<\s*\/\s*\1\s*>|\s*\/\s*>)/mig;

    var _cache = {};

    var _html2Dom = function (html) {
        var container = document.createElement('div');

        container.innerHTML = html;

        return container.firstChild;
    };

    var createRepeatingElements = function (data, elm) {
        var str = '',
            i = 0,
            row,
            max =  elm.getAttribute('data-repeat-count'),
            prop = elm.getAttribute('data-repeat'),
            len = (data = data[prop]) ? data.length || max : 0,
            replaceVars = function (match, p1) {
                return this[p1];
            };

        for (i; i < len; ++i) {
            row = data[i];
            str += elm.outerHTML.replace(_re2, replaceVars.bind(row));
        }

        str = str.replace(/\sdata-repeat="\w+"/gi, '');

        if (max) {
            str = str.replace(/\sdata-repeat-count="\d+"/gi, '');
        }

        if (!elm.parentNode.innerHTML) {
            elm.parentNode.childNodes[0].innerHTML = str;
            elm = elm.parentNode.childNodes[0];
        } else {
            elm.parentNode.innerHTML = str;
        }

        return elm;
    };

    var getArgs = function (node) {
        var attrs = node.attributes, i = 0, len = attrs.length, attr,
            args = [];

        for (; i < len; ++i) {
            attr = attrs[i];
            if (attr.nodeName.indexOf('data-event-args-') === 0) {
                args.push(attr.value);
            }
        }

        return args;
    };

    var build = function (box) {
        return getTemplate(box.template, true).then(function (templateStr) {
                // cache inner templates
                templateStr.replace(templateSignature, function (match, p1, p2) {
                    match = match.replace(/\{\{\+/g, '{{');
                    match = match.replace(/\sdata-repeat="\w+"/gi, '');
                    box.templates[p2] = match.replace(/\sdata-template="[\w\-_]+"/gi, '');
                });
                // single variable replacement
                var html = templateStr.replace(_re1, function (match, p1) {
                        var nodes = p1.split('.'),
                            node = nodes.shift(),
                            len = nodes.length,
                            data = box.data,
                            returnVal = data ? data[node] : '';

                        for (; len > 0;) {
                            node = nodes.shift();
                            len = nodes.length;
                            returnVal = returnVal[node];
                        }

                        if (returnVal instanceof Function) {
                            returnVal = returnVal.call(data);
                        }

                        return returnVal !== 'undefined' ? returnVal : '';
                    }),
                    hub = box.model.prototype,
                    i, len, j, jLen, repeaters, repeater,
                    domNodes, nodes, node,/* nodeName,*/
                    handlers, handler, newHandler, handlerArray = [];

                html = _html2Dom(html);
                // html is a node, but not an element, so...
                box.appendChild(html);
                html = box.firstChild;
                // html now has all true Element methods and properties :)

                // repeaters and inner variable replacement
                repeaters = html.querySelectorAll('[data-repeat]');
                if (repeaters.length === 0) {
                    repeaters = html.getAttribute('data-repeat') ? [html] : [];
                }
                for (i = 0, len = repeaters.length; i < len; ++i) {
                    repeater = repeaters[i];
                    createRepeatingElements(box.data, repeater);
                }
                // cache data-index dom nodes in box.index
                domNodes = html.querySelectorAll('[data-index]');
                for (i = 0, len = domNodes.length; i < len; ++i) {
                    node = domNodes[i];
                    box.index[node.getAttribute('data-index')] = node;
                }
                // attach dom event handlers
                handlers = box.domEvents;
                for (i = 0, len = handlers.length; i < len; ++i) {
                    handler = handlers[i];
                    if (handler.id) {
                        handler.id = handler.id.replace(/^_/,'');
                        nodes = html.querySelectorAll('[data-index=' + handler.id + ']');
                        if (!nodes.length) {
                            nodes = html.querySelectorAll('[data-index^=_' + handler.id + ']');
                        }
                        for (j = 0, jLen = nodes.length; j < jLen; ++j) {
                            node = nodes[j];
                            //nodeName = node.getAttribute('data-index');
                            if (node) {
                                newHandler = {};
                                newHandler.args = getArgs(node);
                                newHandler.event = handler.event;
                                newHandler.context = handler.context;
                                newHandler.callback = handler.callback;
                                handlerArray.push(newHandler);
                                node.addEventListener(newHandler.event, function callback () {
                                    var h = this.handler,
                                        args = Array.from(h.args);

                                    args.push(this.node);
                                    args.push(this.box);

                                    return h.callback.apply(h.context || null, args);
                                }.bind({
                                    'handler': newHandler,
                                    'node': node,
                                    'box': box
                                }));
                            }
                        }
                    } else {
                        //this event is already hooked up!
                        handlerArray.push(handler);
                    }
                }
                box.domEvents = Array.from(handlerArray);
                handlerArray = [];
                // attach model event handlers;
                if (hub.hasOwnProperty('addListener')) {  // eventHub is connected...
                    handlers = box.modelEvents;
                    for (i = 0, len = handlers.length; i < len; ++i) {
                        handler = handlers[i];
                        if (handler.id) {
                            handler.id = handler.id.replace(/^_/,'');
                            nodes = html.querySelectorAll('[data-index=' + handler.id + ']');
                            if (!nodes.length) {
                                nodes = html.querySelectorAll('[data-index^=_' + handler.id + ']');
                            }
                            for (j = 0, jLen = nodes.length; j < jLen; ++j) {
                                node = nodes[j];
                                //nodeName = node.getAttribute('data-index');
                                if (node) {
                                    newHandler = {};
                                    newHandler.args = getArgs(node);
                                    newHandler.event = handler.event;
                                    newHandler.context = handler.context;
                                    newHandler.callback = handler.callback;
                                    handlerArray.push(newHandler);
                                    hub.addListener(
                                        newHandler.event,
                                        function (detail) {
                                            var h = this.handler,
                                                args = Array.from(h.args);

                                            args.push(detail);
                                            args.push(this.node);
                                            args.push(this.box);

                                            return  h.callback.apply(h.context || null, args);
                                        }.bind({
                                            'handler': newHandler,
                                            'node': node,
                                            'box': box
                                        }),
                                        node
                                    );
                                }
                            }
                        } else {
                            // already hooked up
                            handlerArray.push(handler);
                        }
                    }
                    box.modelEvents = Array.from(handlerArray);
                }
                // store reference to the box on html
                html.box = box;
                // auto-attach?
                if (box.destination) {
                    box.destination.appendChild(box);
                }
                // resolve promise with the Box
                return box;
            });
        /*});*/
    };

    var cache = function (name, template) {
        _cache[name] = template;
    };

    var getCached = function (name) {
        return _cache[name];
    };

    var getTemplate = function (uri, useCache) {
        uri = decodeURI(uri);

        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest(),
                separatorIndex = uri.indexOf('?'),
                sliceIndex = separatorIndex < 0 ? uri.length : separatorIndex,
                resource = uri.slice(0, sliceIndex),
                cachedName = resource.replace(/\/|\./g, ''),
                cachedTemplate;

            if (uri.indexOf('<') !== -1) {
                // getTemplate was called on an html string, just return it
                resolve(uri);
                return;
            }

            if (useCache) {
                cachedTemplate = getCached(cachedName);
                if (cachedTemplate) {
                    resolve(cachedTemplate);
                    return;
                }
            }

            xhr.open('GET', resource);

            xhr.onload = function () {
                var response = xhr.response;

                if (response) {
                    // promise completed successfully... cache the template?
                    if (useCache) {
                        cache(cachedName, response);
                    }
                    resolve(response);
                } else {
                    // reject promise - request error
                    reject(Error(xhr.statusText));
                }
            };

            xhr.onerror = function () {
                // reject promise - xhr epic fail
                reject(Error("Network Error"));
            };

            xhr.send();
        });
    };

    return {
        build: build
    };
});