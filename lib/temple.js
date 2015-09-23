/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['notify'], function (notify) {
    var _re1 = /\{\{([\w\-\.]*)\}\}/mig;

    var _re2 = /\{\{\+([\w\-\.]+)\}\}/mig;

    var _cache = {};

    var _html2Dom = function (html) {
        var container = document.createElement('div');

        container.innerHTML = html;

        return container.firstChild;
    };

    var _build = function (html, model, toDom) {
        var repeaters,
            repeater,
            dataRoot,
            callBacks,
            callback,
            eventName,
            frag,
            list,
            len,
            el,
            i;

        if (model) {
            html = html.replace(_re1, function () {
                var matched = RegExp.$1,
                    nodes = matched.split('.'),
                    root = nodes.shift(),
                    i = 0, len = nodes.length,
                    returnVal = model[root];

                for (i; i < len; ++i) {
                    if (i === 0 && returnVal[0]) {
                        returnVal = returnVal[0][nodes[0]];
                    } else if (returnVal) {
                        returnVal = returnVal[nodes[i]];
                    } else {
                        break;
                    }
                }

                if (returnVal instanceof Function) {
                    returnVal = returnVal.call(model);
                }

                return returnVal !== 'undefined' ? returnVal : '';
            });

            html = _html2Dom(html);
            // html is a node, but not an element, so...
            frag = document.createDocumentFragment();
            frag.appendChild(html);
            html = frag.firstChild;
            // html now has all true Element methods and properties :)

            var createRepeatingElements = function(root, elm) {
                var dataObjects = model[root] || [],
                    dataObj,
                    content,
                    str = '',
                    i = 0,
                    max =  elm.getAttribute('data-repeat-count'),
                    len = dataObjects.length || max,
                    getDataNode = function () {
                        var dataNode = dataObj[RegExp.$1];

                        return dataNode;
                    };

                for (i; i < len; ++i) {
                    dataObj = dataObjects[i];
                    content = typeof dataObj === 'object' ? getDataNode : dataObj;
                    str += elm.outerHTML.replace(_re2, content);
                }

                str = str.replace(/data-repeat=\"\w+\"/gi, '');
                if (max) {
                    str = str.replace(/data-repeat-count=\"\d+\"/gi, '');
                }

                elm.parentNode.innerHTML = str;
            };

            if (repeaters = html.querySelectorAll('[data-repeat]')) {
                for (i = 0, len = repeaters.length; i < len; ++i) {
                    repeater = repeaters[i];
                    dataRoot = repeater.getAttribute('data-repeat');
                    createRepeatingElements(dataRoot, repeater);
                }
            }
        }

        callBacks = model._callBacks;
        if (callBacks && (list = html.querySelectorAll('[data-event-listener]'))) {
            for (i = 0, len = list.length; i < len; ++i) {
                el = list[i];
                eventName = el.getAttribute('data-event-listener');
                callback = callBacks[eventName];
                el.addEventListener(callback.event, callback.function);
            }
        }

        // Create event handlers for data-bound elements
        var dataBound = html.querySelectorAll('[data-bind]'),
            domEl,
            domEvent,
            params,
            path,
            topicName,
            eventHandler,
            f = function (p, t, m) {
                // p = path, t = topicName, m = modelName
                return function () {
                    model.update(p, this.value, t, m);
                };
            };

        for (i = 0, len = dataBound.length; i < len; ++i) {
            domEl = dataBound[i];
            params = domEl.getAttribute('data-bind').split(':');
            domEvent = params[0];
            path = params[1];
            topicName = params.length === 3 ? params[2] : null;
            eventHandler = f(path, topicName, model.modelName);
            domEl.addEventListener(domEvent, eventHandler, false);
        }

        return toDom ? html : html.outerHTML;
    };

    var cache = function (name, template) {
        _cache[name] = template;
    };

    var getCached = function (name) {
        return _cache[name];
    };

    var removeCached = function (name) {
        _cache[name] = null;
        delete cache[name];
    };

    var toDom = function (html, model) {
        return _build(html, model, true);
    };

    var toString = function (html, model) {
        return _build(html, model, false);
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
                    // promise completed successfully
                    // cache the template?
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
        getTemplate: getTemplate,
        toDom: toDom,
        toString: toString
    };
});
