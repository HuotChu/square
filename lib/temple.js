/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(function () {
    var _re1 = /\{\{([\w\-\.]*)\}\}/mig;

    var _re2 = /\{\{\+([\w\-\.]+)\}\}/mig;

    var _cache = {};

    var _html2Dom = function (html) {
        var container = document.createElement('div');

        container.innerHTML = html;

        return container.firstChild;
    };

    var _build = function (html, data, toDom) {
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

        if (data) {
            html = html.replace(_re1, function (match, p1) {
                var nodes = p1.split('.'),
                    node = nodes.shift(),
                    len = nodes.length,
                    returnVal = data.get ? data.get(node) : data[node];

                for (; len > 0;) {
                    node = nodes.shift();
                    len = nodes.length;
                    returnVal = returnVal[node];
                }

                if (returnVal.dataObject) {
                    returnVal = returnVal.get(node);
                } else if (returnVal instanceof Function) {
                    returnVal = returnVal.call(data);
                }

                return returnVal !== 'undefined' ? returnVal : '';
            });

            html = _html2Dom(html);
            // html is a node, but not an element, so...
            frag = document.createDocumentFragment();
            frag.appendChild(html);
            html = frag.firstChild;
            // html now has all true Element methods and properties :)

            var createRepeatingElements = function (path, elm) {
                var dataObjects = (data._model ? data._model.getNodeFromPath(path) : false) || data[path] || [],
                    dataObj,
                    str = '',
                    i = 0,
                    max =  elm.getAttribute('data-repeat-count'),
                    len = dataObjects.length || max;

                for (i; i < len; ++i) {
                    dataObj = dataObjects[i];
                    str += elm.outerHTML.replace(_re2, function (match, p1) {
                        var rtn = '';

                        if (this.dataObject) {
                            rtn = this.get(p1);
                        } else {
                            rtn = this[p1];
                        }

                        return rtn;
                    }.bind(dataObj));
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

        callBacks = (data._model ? data._model._callBacks : data._callBacks) || [];

        if (callBacks && (list = html.querySelectorAll('[data-dom]'))) {
            for (i = 0, len = list.length; i < len; ++i) {
                el = list[i];
                eventName = el.getAttribute('data-dom');
                callback = callBacks[eventName];
                el.addEventListener(callback.event, callback.function);
            }
        }

        var domDataNodes = data._domDataNodes || data._model ? data._model._domDataNodes : false;

        if (domDataNodes) {
            var dataNodes = html.querySelectorAll('[data-id]');

            for (i = 0, len = dataNodes.length; i < len; ++i) {
                el = dataNodes[i];
                domDataNodes.setNode(el.getAttribute('data-id'), el);
            }
        }

        var dataSpy = data._dataSpy || data._model ? data._model._dataSpy : false;

        if (dataSpy && domDataNodes) {
            var setDataSpies = function (el) {
                var dataTopic = el.getAttribute('data-spy').replace(/\./g, '_'),
                    modelEvent = el.getAttribute('data-event'),
                    modelCallBack = el.getAttribute('data-handler'),
                    modelUpdate = el.getAttribute('data-react'),
                    domId = el.getAttribute('data-id'),
                    modelDom = domDataNodes.getEl(domId),
                    e = dataSpy[modelEvent],
                    spyName = dataTopic + Date.now(),
                    model = data._model,
                    spy = model.newDataObject().set({
                        node: el,
                        id  : spyName
                    }),
                    topic;

                if (e) {
                    if (modelDom) {
                        modelDom.spyName = spyName;
                    }
                    if (modelCallBack) {
                        spy.set(modelCallBack, 'callBack');
                    }
                    if (modelUpdate) {
                        spy.set(modelUpdate, 'react');
                    }

                    topic = e[dataTopic];

                    if (!topic) {
                        e[dataTopic] = model.newDataArray().add(spy);
                    } else {
                        e[dataTopic].add(spy);
                    }
                }
            }, dataSpies = html.querySelectorAll('[data-spy]');

            for (i = 0, len = dataSpies.length; i < len; ++i) {
                setDataSpies(dataSpies[i]);
            }
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
