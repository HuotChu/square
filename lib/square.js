/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
var square = (function() {
    'use strict';

    // Convenience Methods
    String.prototype.trim = function() {
        return this.replace(/^\s|\s$/g, '');
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

                var i, len, keysArray, nextSource, nextIndex, nextKey, desc, to;

                if (target === undefined || target === null) {
                    throw new TypeError('Cannot convert first argument to object');
                }

                to = Object(target);
                for (i = 1, len = arguments.length; i < len; ++i) {
                    nextSource = arguments[i];
                    if (nextSource === undefined || nextSource === null) {
                        continue;
                    }
                    nextSource = Object(nextSource);

                    keysArray = Object.keys(nextSource);
                    for (nextIndex = 0, len = keysArray.length; nextIndex < len; ++nextIndex) {
                        nextKey = keysArray[nextIndex];
                        desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                        if (desc !== undefined && desc.enumerable) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
                return to;
            }
        });
    }

    /*
     * request.js
     */
    var request = function(uri, post) {
        uri = decodeURI(uri);
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest(),
                separatorIndex = uri.indexOf('?'),
                sliceIndex = separatorIndex < 0 ? uri.length : separatorIndex,
                resource = uri.slice(0, sliceIndex),
                args = uri.slice(sliceIndex + 1).split('&');

            xhr.open(!post ? 'GET' : 'POST', resource);

            if (post) {
                xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            }

            xhr.onload = function() {
                var i = 0, len, prop, val, temp;

                if (xhr.response) {
                    if (args.length) {
                        // if arguments were passed on the URI, attach them to the xhr object
                        xhr.uriArgs = {};
                        len = args.length;
                        for (i; i < len; ++i) {
                            temp = args[i].split('=');
                            prop = temp[0];
                            val = temp[1];
                            xhr.uriArgs[prop] = val;
                        }
                    }
                    // promise completed successfully
                    resolve(xhr);
                } else {
                    // reject promise - request error
                    reject(Error(xhr.statusText));
                }
            };

            xhr.onerror = function() {
                // reject promise - xhr epic fail
                reject(Error("Network Error"));
            };

            xhr.send(!post ? null : args);
        });
    };

    /*
     * temple.js
     */
    var temple = (function() {
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
                    hub = box.model,
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
                if (hub.addListener) {  // eventHub is connected...
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
    }());

    /*
     * box.js
     */
    var box = (function() {
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

        return function (config) {
            var box = buildABox(config);

            this.__proto__ = {
                view:  temple.build(box)
            };

            if (!this.prototype) {
                Object.defineProperty(this, 'prototype', {
                    enumerable: false,
                    configurable: false,
                    value: this.__proto__
                });
            }
        };
    }());

    /*
     * eventHub.js
     */
    var eventHub = (function() {
        'use strict';

        var createEventNode = function () {
            return document.createElement('object');
        };

        var customEvent = function (eventName, detail, cancel, exposeAll) {
            return new CustomEvent(eventName, {'cancelable': !!cancel, 'detail': exposeAll ? exposeDetail(detail) : detail});
        };

        var exposeDetail = function (o) {
            // expose all properties of a CustomEvent.detail to content scripts
            'use strict';
            var no = {__exposedProps__: {}},
                val, prop;

            for (prop in o) {
                if (o.hasOwnProperty(prop)) {
                    val = o[prop];
                    no[prop] = val;
                    no.__exposedProps__[prop] = val;
                }
            }

            return no;
        };

        var watchers = {};

        var callBacks = {};

        var dispatch = function (eventName, detail, bubbles, cancel, exposeAll) {
            var hub = this.eventNode,
                crud = '',
                path = eventName.replace(/(\.\w{4,6})$/i, function (match, capture) {
                    // capture = one of: create|read|update|delete
                    crud = capture;

                    return '';
                }),
                fireEvents = function () {
                    hub.dispatchEvent(customEvent(path + crud, detail, cancel, exposeAll));
                    if (crud !== '.read') {
                        hub.dispatchEvent(customEvent(path + '.change', detail, cancel, exposeAll));
                    } else {
                        hub.dispatchEvent(customEvent(path + '.all', detail, cancel, exposeAll));
                    }
                };

            detail = detail || {};
            detail.origin = eventName;
            fireEvents();

            if (bubbles !== false) {
                // "I don't think that word means what you think it means..."
                // there is no DOM to bubble up or down, so bubbling here involves parent nodes in the model
                // paths 'bubble up' to parent nodes denoted by the eventName
                // detail.bubbles tells listeners this event bubbles and where it originated [eventName]
                while (true) {
                    path = path.split('.');
                    detail.lastNode = path.pop();
                    if (!path.length) {
                        break;
                    }
                    path = path.join('.');
                    fireEvents();
                }
            }

            return true;
        };

        var addListener = function (eventName, callBack, currentTarget) {
            var watchers = this.watchers,
                eventArray = watchers[eventName],
                listener;

            if (currentTarget) {
                callBack = callBack.bind(currentTarget);
            }

            if (!eventArray) {
                eventArray = watchers[eventName] = [];
            }

            listener = this.eventNode.addEventListener(eventName, callBack, false);

            eventArray.push(listener);

            return listener;
        };

        var removeListener = function (listener) {
            return this.eventNode.removeEventListener(listener);
        };

        var garbageCollect = function (deadObject) {
            var event = deadObject.event,
                watchers = this.watchers,
                watcherArray = watchers[event],
                watcher,
                i = 0,
                len;

            if (event && watcherArray) {
                // remove all event handlers for this Object
                for (i, len = watcherArray.length; i < len; ++i) {
                    watcher = watcherArray[i];
                    this.removeListener(watcher);
                }

                watchers[event] = null;
                delete watchers[event];
            }
        };

        var connect = function (o) {
            var newO, proto = o.__proto__;

            newO = Object.create(proto);
            Object.assign(newO.__proto__, hub);
            newO.__proto__.eventNode = createEventNode();

            return newO;
        };

        var hub = {
            'connect': connect,
            'callBacks': callBacks,
            'watchers': watchers,
            'dispatch': dispatch,
            'addListener': addListener,
            'removeListener': removeListener,
            'garbageCollect': garbageCollect
        };

        return hub;
    }());

    /*
     * lobro.js
     */
    var lobro = (function() {
        'use strict';

        var lo = window.localStorage;

        // Save table to localStorage
        var putLocal = function (table) {
            var json;

            try {
                json = JSON.stringify(table);
                if (json) {
                    lo.setItem(table._event, json);
                }
            } catch  (err) {
                console.log(err);
            }
        };

        // Remove from localStorage
        var remove = function (name) {
            lo.removeItem(name);
        };

        // Save entire db to localStorage
        var persist = function (db, version) {
            var table,
                o = {
                    version: version || 1
                };

            Object.defineProperty(o, '_event', {
                enumerable: false,
                value: db._event
            });

            for (table in db) {
                if (db.hasOwnProperty(table)) {
                    putLocal(db[table]);
                }
            }
            // save the DB name as a key in local storage, so we can easily check for existence of backup
            putLocal(o);
        };

        // Get model data from localStorage
        var sync = function (dbName) {
            var store = {},
                reg = new RegExp('^' + dbName + '\\.[\\w\\-_\\.]+'),
                key;

            store[dbName] = {};
            store = store[dbName];

            for (key in lo) {
                if (lo.hasOwnProperty(key)) {
                    if (reg.test(key)) {
                        store[key] = JSON.parse(lo[key]);
                    }
                }
            }

            return this.restore ? this.restore(store, dbName) : store;
        };

        var connect = function (o) {
            var newO,
                proto = o.__proto__,
                addListener = function () {
                    newO.addListener(newO._event + '.change', function (event) {
                        var origin = event.detail.origin,
                            reg = new RegExp('^' + newO._event +'\\.([^\\.]+)', 'i'),
                            table = origin.match(reg);

                        table = table && table[1];

                        if (table && typeof table === 'string' && /create|read|update|delete/.test(table) === false) {
                            newO.putLocal(newO[table]);
                        }
                    }, newO);
                },
                enableEvents = '',
                loadingPromise = new Promise(function (resolve) {
                    enableEvents = resolve;
                });

            newO = Object.create(proto);
            Object.assign(newO.__proto__, lobro);
            newO.__proto__.enableEvents = enableEvents;

            if (newO.dispatch) {
                loadingPromise.then(function () {
                    addListener();
                });
            }

            return newO;
        };

        // Get a table from local storage
        var getLocal = function (name) {
            var table = lo.getItem(name);

            if (table) {
                table = JSON.parse(table);
            }

            return table;
        };

        var clear = function () {
            lo.clear();

            return lo;
        };

        var isCurrent = function (dbName, version) {
            var exists = getLocal(dbName);

            return exists && exists.version === version;
        };

        var lobro =   {
            connect: connect,
            isCurrent: isCurrent,
            clearLocal: clear,
            getLocal: getLocal,
            putLocal: putLocal,
            persist: persist,
            removeLocal: remove,
            sync: sync
        };

        return lobro;
    }());

    /*
     * ************
     * SQUAREDB
     * ************
     * squaredb.js
     */
    var squaredb = (function() {
        'use strict';

        var Table = function (db, tableName) {
            // set prototype on the instance when `new Table()`
            // set prototype on constructor on instantiation
            this.__proto__ = {
                '_db': db,
                '_event': db._event + '.' + tableName,
                'constructor': this,
                'columns': function () {
                    var cols = [], prop;

                    for (prop in this) {
                        if (this.hasOwnProperty(prop)) {
                            cols.push(prop);
                        }
                    }

                    return cols;
                },
                'count': function () {
                    var len = this.indices().length,
                        db = this._db;

                    if (db.dispatch) {
                        db.dispatch(this._event + '.count.read', {
                            value: len
                        });
                    }

                    return len;
                },
                'indices': function () {
                    var indices = [],
                        col, prop, i = 0, len;

                    for (prop in this) {
                        if (this.hasOwnProperty(prop)) {
                            col = this[prop];
                            for (len = col.length; i < len; ++i) {
                                if (col[i] !== null) {
                                    indices.push(i);
                                }
                            }
                            return indices;
                        }
                    }

                    return indices;
                },
                'holes': function () {
                    var holes = [],
                        col, prop, i = 0, len;

                    for (prop in this) {
                        if (this.hasOwnProperty(prop)) {
                            col = this[prop];
                            for (len = col.length; i < len; ++i) {
                                if (col[i] === null) {
                                    holes.push(i);
                                }
                            }
                            return holes;
                        }
                    }

                    return holes;
                }
            };

            if (!this.prototype) {
                Object.defineProperty(this, 'prototype', {
                    enumerable: false,
                    configurable: false,
                    value: this.__proto__
                });
            }

            return this;
        };

        var Column = function (table, columnName) {
            this.__proto__ = {
                '_event': table && columnName && table._event + '.' + columnName,
                '_db': table && table._db,
                '_table': table,
                'push': function (x) {
                    var db = this._db,
                        pushed = Array.prototype.push.call(this, x);

                    if (db.dispatch) {
                        db.dispatch(this._event + '.create', {
                            value: x,
                            index: this.length - 1
                        });
                        this._table.count();
                    }

                    return pushed;
                },
                'insert': function (x, ndx) {
                    var db = this._db;

                    this[ndx] = x;
                    if (db.dispatch) {
                        db.dispatch(this._event + '.' + ndx + '.update', {
                            value: x,
                            index: ndx
                        });
                    }
                }
            };

            if (!this.prototype) {
                Object.defineProperty(this, 'prototype', {
                    enumerable: false,
                    configurable: false,
                    value: this.__proto__
                });

                this.prototype.__proto__ = Array.prototype;
            }

            return this;
        };

        var _memory = {},
            getColumnNames = function (/*columns*/) {
                var columnNames = Array.from(arguments);

                if (columnNames.length === 1) {
                    columnNames = columnNames[0];
                    if (columnNames.indexOf(',') !== -1) {
                        columnNames = columnNames.split(',').map(function (el) {
                            return el.trim();
                        });
                    }
                    if (columnNames instanceof Array === false) {
                        columnNames = [columnNames];
                    }
                }

                return columnNames;
            },
            Where = function (table, column, operator, control) {
                this.validIndices = comparator(table[column], operator, control);
                this.AND = this.and = function (column, operator, control) {
                    var newIndices = comparator(table[column], operator, control);

                    this.validIndices = this.validIndices.filter(function (v) {
                        return newIndices.indexOf(v) !== -1;
                    });

                    return this;
                };
                this.OR = this.or = function (column, operator, control) {
                    var cache = [];

                    this.validIndices = this.validIndices.concat(comparator(table[column], operator, control));

                    this.validIndices = this.validIndices.filter(function (v) {
                        if (cache.indexOf(v) === -1) {
                            cache.push(v);
                            return true;
                        }
                    });

                    return this;
                };
            };

        _memory.__proto__ = {
            'create': function (dbName) {
                var db = new DB(dbName);

                this[dbName] = db;

                return db;
            },
            'drop': function (dbName) {
                if (this[dbName]) {
                    this[dbName] = null;
                    delete this[dbName];

                    return true;
                }

                return false;
            },
            'get': function (dbName) {
                return this[dbName];
            },
            'show': function () {
                var prop, arr = [];

                for (prop in this) {
                    if (this.hasOwnProperty(prop)) {
                        arr.push(prop);
                    }
                }

                return arr;
            }
        };

        var DB = function DB (dbName) {
            this.__proto__ = {
                '_event': dbName,
                '_tableCount': 0,
                'count': function () {
                    var count =  this._tableCount;

                    if (this.dispatch) {
                        this.dispatch(this._event + '.count.read', {
                            value: count
                        });
                    }
                    return count;
                },
                'COUNT': function () {
                    return this.count.call(this);
                },
                'select': function (/*selects*/) {
                    var selects = getColumnNames.apply(null, arguments);

                    return new Select(this, selects);
                },
                'SELECT': function (/*selects*/) {
                    return this.select.apply(this, arguments);
                },
                'createTable': function (tableName) {
                    /**
                     * createTable adds a new Table Object <tableName> to the DB Object
                     * @param {String} tableName Name to assign to the new table
                     * @returns {Function} Returns a curried function waiting for the columns argument
                     */
                    var db = this,
                        table = new Table(db, tableName);

                    db[tableName] = table;

                    if (db.dispatch) {
                        db.dispatch(this._event + '.create', {
                            value: table
                        });
                    }

                    ++this._tableCount;
                    this.count();

                    return function (/*columns*/) {
                        var columns = getColumnNames.apply({}, arguments);

                        if (columns.length) {
                            db.alterTable(tableName).add.apply({}, arguments);
                        }

                        return table;
                    };
                },
                'CREATE_TABLE': function (tableName) {
                    return this.createTable.call(this, tableName);
                },
                'alterTable': function (tableName) {
                    var table = this[tableName];

                    return {
                        'add': function (/*columns*/) {
                            var cols = getColumnNames.apply(null, arguments),
                                col, i = 0, len = cols.length,
                                indices = table.indices(),
                                holes = table.holes(),
                                j = 0, jLen = indices.length,
                                newColumn, db = table._db;

                            for (i; i < len; ++i) {
                                col = cols[i];
                                newColumn = table[col] = new Column(table, col);
                                for (j = 0; j < jLen; ++j) {
                                    newColumn.insert(undefined, indices[j]);
                                }
                                jLen = holes.length;
                                for (j = 0; j < jLen; ++j) {
                                    newColumn.insert(null, holes[j]);
                                }
                                if (db.dispatch) {
                                    db.dispatch(table._event + '.create', {
                                        value: newColumn
                                    });
                                }
                            }

                            return table;
                        },
                        'ADD': function (/*columns*/) {
                            return this.add.apply(this, arguments);
                        },
                        'drop': function (/*columns*/) {
                            var cols = getColumnNames.apply(null, arguments),
                                col, i = 0, len, db = table._db;

                            if (cols.length === 0 || cols[0] === '*') {
                                cols = table.columns();
                            }

                            for (len = cols.length; i < len; ++i) {
                                col = cols[i];
                                table[col] = null;
                                delete table[col];
                                if (db.dispatch) {
                                    db.dispatch(table._event + '.delete', {
                                        value: col
                                    });
                                }
                            }

                            return table;
                        },
                        'DROP': function (/*columns*/) {
                            return this.drop.apply(this, arguments);
                        },
                        'modify': function () {
                            // only needed if I support data types on columns
                        }
                    }
                },
                'ALTER_TABLE': function (tableName) {
                    return this.alterTable.call(this, tableName);
                },
                'insertInto': function (tableName) {
                    var table = this[tableName];

                    return function (/*columns*/) {
                        var columns = getColumnNames.apply({}, arguments),
                            values = function (/*insertValues*/) {
                                var vals = Array.from(arguments),
                                    column, columnName, val, i = 0, len = columns.length;

                                for (i; i < len; ++i) {
                                    columnName = columns[i];
                                    val = vals[i];
                                    column = table[columnName];
                                    column.push(val);
                                }

                                for (columnName in table) {
                                    if (table.hasOwnProperty(columnName)) {
                                        if (columns.indexOf(columnName) === -1) {
                                            // all columns in the table that did not get a value set should be set to undefined
                                            table[columnName].push(undefined);
                                        }
                                    }
                                }

                                return values;
                            };

                        return {
                            'values': values,
                            'VALUES': values
                        };
                    };
                },
                'INSERT_INTO': function (tableName) {
                    return this.insertInto.call(this, tableName);
                },
                'insertJsonInto': function (tableName) {
                    var table = this[tableName],
                        db = this;

                    return function (insertObjects /*[objects]*/) {
                        var prop, insert, columnNames, add, vals,
                            i =0, len = insertObjects.length,
                            tableName = table._event.substr(table._event.indexOf('.') + 1),
                            insertToColumns = db.insertInto(tableName);

                        for (i; i < len; ++i) {
                            insert = insertObjects[i];
                            columnNames = [];
                            vals = [];
                            for (prop in insert) {
                                if (insert.hasOwnProperty(prop)) {
                                    if (!table[prop]) {
                                        db.alterTable(tableName).add(prop);
                                    }
                                    columnNames.push(prop);
                                    vals.push(insert[prop]);
                                }
                            }
                            add = insertToColumns.apply(null, columnNames);
                            add.values.apply(null, vals);
                        }
                    };
                },
                'INSERT_JSON_INTO': function (tableName) {
                    this.insertJsonInto.call(this, tableName);
                },
                'update': function (tableName) {
                    var table = this[tableName],
                        db = table._db,
                        updateMap = {},
                        set = function (column, value) {
                            updateMap[column] = value;

                            return set;
                        };

                    set.WHERE = set.where = function (column, operator, control) {
                        var w = new Where(table, column, operator, control);

                        w.GO = w.go = function () {
                            var i = 0, len = this.validIndices.length, ndx, prop, val, crud = '.update' ;

                            for (i; i < len; ++i) {
                                ndx = this.validIndices[i];
                                for (prop in table) {
                                    if (table.hasOwnProperty(prop) && updateMap[prop]) {
                                        val = updateMap[prop];
                                        table[prop][ndx] = val;
                                        if (db.dispatch) {
                                            if (val === null) {
                                                crud = '.delete';
                                            }
                                            db.dispatch(table._event + '.' + prop + crud, {
                                                value: val,
                                                index: ndx
                                            });
                                        }
                                    }
                                }
                            }

                            return true;
                        };

                        return w;
                    };

                    return {
                        'set': set,
                        'SET': set
                    }
                },
                'UPDATE': function (tableName) {
                    return this.update.call(this, tableName);
                },
                'delete': function (/*columnNames*/) {
                    var columns = getColumnNames.apply({}, arguments),
                        db = this,
                        table,
                        from = function (tableName) {
                            table = db[tableName];
                            if (columns.length === 0 || columns[0] === '*') {
                                columns = table.columns();
                            }

                            return {
                                'where': where,
                                'WHERE': where,
                                'go': go,
                                'GO': go
                            }
                        },
                        go = function () {
                            var matches = this.validIndices,
                                i = 0, len, ndx, j, colLen = columns.length, column;

                            if (matches === undefined) {
                                matches = table.indices();
                                // table.indices gives all possible matches
                            }

                            for (i, len = matches.length; i < len; ++i) {
                                ndx = matches[i];
                                for (j = 0; j < colLen; ++j) {
                                    column = table[columns[j]];
                                    column.insert(null, ndx);
                                    if (db.dispatch) {
                                        db.dispatch(column._event + '.' + ndx + '.delete', {
                                            value: null,
                                            index: ndx
                                        });
                                        --table._tableCount;
                                        table.count();
                                    }
                                }
                            }

                            return true;
                        },
                        where = function (column, operator, control) {
                            var w = new Where(table, column, operator, control);

                            w.GO = w.go = go.bind(w);

                            return w;
                        };

                    return {
                        'from': from,
                        'FROM': from
                    };
                },
                'DELETE': function (/*columnNames*/) {
                    return this.delete.apply(this, arguments);
                },
                'createUnique': function () {
                    var tsa = new Date().getTime().toString().split(''),
                        abc = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
                        i = 0, len = tsa.length, rtn = [], n, a;

                    for (; i < len; ++i) {
                        n = tsa[i];
                        a = abc[n];
                        if (i % 2 === 0) {
                            if (i % 8 === 4) {
                                a = a.toUpperCase();
                            }
                            rtn.push(a);
                        } else {
                            rtn.push(n);
                        }
                    }

                    rtn = rtn.map(function (v) {
                        switch (v) {
                            case '0': return 'O';
                            case '1': return 'I';
                            case '2': return 'R';
                            case '3': return 'E';
                            case '4': return 'F';
                            case '5': return 'S';
                            case '6': return 'b';
                            case '7': return 'L';
                            case '8': return 'B';
                            case '9': return 'q';
                            default: return v;
                        }
                    });

                    return rtn.join('');
                },
                restore: function (backup, dbName) {
                    var i,  len, path, insert, table, columns,
                        tableName = '',
                        tempArray,
                        reg = new RegExp(dbName + '\\.(\.+)');

                    for (path in backup) {
                        if (backup.hasOwnProperty(path)) {
                            tableName = path.match(reg)[1];
                            table = backup[path];
                            columns = Object.keys(backup[path]);
                            this.createTable(tableName)(columns);
                            len = table[columns[0]].length;
                            insert = this.insertInto(tableName)(columns);
                            for (i = 0; i < len; ++i) {
                                tempArray = [];
                                columns.forEach(function (column) {
                                    tempArray.push(table[column][i]);
                                });
                                insert.values.apply(this, tempArray);
                            }
                        }
                    }
                }
            };

            if (!this.prototype) {
                Object.defineProperty(this, 'prototype', {
                    enumerable: false,
                    configurable: false,
                    value: this.__proto__
                });
            }

            return this;
        };

        return {
            'createDB': _memory.create,
            'CREATE_DATABASE': _memory.create,
            'dropDB': _memory.drop,
            'DROP_DATABASE': _memory.drop,
            'use': _memory.get,
            'USE': _memory.get,
            'show': _memory.show,
            'SHOW_DATABASES': _memory.show
        };
    }());

    /*
     * aggregates.js
     */
    var aggregates = (function() {
        'use strict';

        return function (sortObject, operation, targetColumn) {
            // sortObject contains the column to perform the aggregate function on
            var sortArray = sortObject[targetColumn],
                columnNames = [], column,
                len = sortArray.length,
                val, valid;

            for (column in sortObject) {
                if (sortObject.hasOwnProperty(column)) {
                    columnNames.push(column);
                }
            }

            val = sortArray.reduce(function (previous, current) {
                var rtn;

                if (operation === 'min') {
                    rtn = previous < current ? previous : current;
                } else if (operation === 'max') {
                    rtn = previous > current ? previous : current;
                } else if (operation === 'sum' || operation === 'avg') {
                    rtn = previous + current;
                }

                return rtn;
            });

            if (operation === 'avg') {
                val = val / len;
            } else if (operation === 'count') {
                val = len * columnNames.length;
                sortObject = {'QUERY_COUNT': [val]};
                return sortObject;
            }

            if (columnNames.length > 1) {
                valid = comparator(sortObject[targetColumn], '===', val);
                columnNames.forEach(function (cName) {
                    if (cName !== targetColumn) {
                        column = sortObject[cName];
                        sortObject[cName] = column.filter(function (v, i) {
                            return valid.indexOf(i) !== -1;
                        });
                    }
                });
            }

            sortObject[targetColumn] = [val];

            return sortObject;
        };
    }());

    /*
     * comparator.js
     */
    var comparator = (function() {
        'use strict';

        return function (column, operator, control) {
            var firstPeriod = typeof control === 'string' ? control.indexOf('.') : -1,
                secondPeriod = typeof control === 'string' ? control.lastIndexOf('.') : -1,
                startsWith = firstPeriod !== 0,
                endsWith = control.length && secondPeriod !== control.length - 1,
                i = 0, len = column.length, matches = [],
                found, row, inMatches, regX;

            if (operator === 'like' || operator === 'not like') {
                if (startsWith) {
                    control = '^' + control;
                }
                if (endsWith) {
                    control += '$';
                }
            }

            for (i; i < len; ++i) {
                row = column[i];
                if (row) {
                    switch (operator) {
                        case '==':
                            found = row == control;
                            break;
                        case '===':
                            found = row === control;
                            break;
                        case '>':
                            found = row > control;
                            break;
                        case '<':
                            found = row < control;
                            break;
                        case '>=':
                            found = row >= control;
                            break;
                        case '<=':
                            found = row <= control;
                            break;
                        case '!=':
                            found = row != control;
                            break;
                        case '!==':
                            found = row !== control;
                            break;
                        case 'like':
                            regX = new RegExp(control, 'i');
                            found = regX.test(row);
                            break;
                        case 'not like':
                            regX = new RegExp(control, 'i');
                            found = !regX.test(row);
                            break;
                        default:
                            found = false;
                    }

                    inMatches = matches.indexOf(i) > -1; // if already in matches, don't add it again...
                    if (found && !inMatches) {
                        matches.push(i);
                    }
                }
            }

            return matches;
        };
    }());

    /*
     * go.js
     */
    var go = (function() {
        'use strict';

        var go = function (queryObject) {
            var o = queryObject,
                db = o.db,
                table = o.table,
                distinct = o.distinct,
                selects = o.selects,
                where = o.where,
                len = selects.length || 1,
                returnArrays = {},
                aggregateStore = {},
                getAllColumns = function () {
                    selects = Object.keys(table);
                    len = selects.length;
                    columnName = selects[0];
                },
                aggregate, regExpMatches, validIndices, newIndices,
                response, select, columnName, column, initial,
                i, j, jLen, and, andi, or, ori, ndx, prop;

            for (i = 0; i < len; ++i) {
                columnName = selects[i];
                // remove any quotes that were used to denote strings
                columnName = columnName.replace(/['"]/g, '');
                // is the column name wrapped in an aggregate?
                if (columnName.indexOf('(') !== -1) {
                    regExpMatches = columnName.match(/^(\w+)\(([^\)]+)\)/);
                    columnName = regExpMatches[2];
                    if (columnName === '*') {
                        getAllColumns();
                    }
                    aggregateStore[columnName] = regExpMatches[1];
                }
                // is this column aliased?
                // todo: enable aliases
                if (columnName.indexOf(' as ') !== -1) {
                    columnName = columnName.replace(/(^\w+)\sas\s\w+/, '$1');
                }
                if (columnName === '*') {
                    getAllColumns();
                }
                column = table[columnName] || [];
                returnArrays[columnName] = column.filter(function (v) {
                    return v !== null;
                });
                validIndices = table.indices();
            }

            if (where) {
                initial = where.initial;
                or = where.or;
                and = where.and;
                // process initial
                validIndices = comparator(table[initial[0]], initial[1], initial[2]);
                // process ORs
                if (or.length) {
                    for (i = 0, len = or.length; i < len; ++i) {
                        ori = or[i];
                        newIndices = comparator(table[ori[0]], ori[1], ori[2]);
                        for (j = 0, jLen = newIndices.length; j < jLen; ++j) {
                            ndx = newIndices[j];
                            if (validIndices.indexOf(ndx) === -1) {
                                validIndices.push(ndx);
                            }
                        }
                    }
                }
                // process ANDs
                if (and.length) {
                    for (i = 0, len = and.length; i < len; ++i) {
                        andi = and[i];
                        newIndices = comparator(table[andi[0]], andi[1], andi[2]);
                        validIndices = validIndices.filter(function (v) {
                            return this.indexOf(v) !== -1;
                        }.bind(newIndices));
                    }
                }

                // reduce columns to only validIndices
                returnArrays = makeValid(returnArrays, validIndices);
            }

            if (distinct) {
                validIndices = getDistinctIndices(returnArrays[distinct]);
                response = makeValid(returnArrays, validIndices);
            } else {
                response = returnArrays;
            }

            // process aggregates
            for (columnName in aggregateStore) {
                if (aggregateStore.hasOwnProperty(columnName)) {
                    aggregate = aggregateStore[columnName];
                    response = aggregates(response, aggregate, columnName);
                }
            }

            response = toJsonArray(response);

            if (aggregate) {
                response = response[0];
            }

            if (db.dispatch) {
                // process model events
                for (i = 0, len = response.length; i < len; ++i) {
                    select = response[i];
                    ndx = validIndices[i];
                    for (prop in select) {
                        if (select.hasOwnProperty(prop)) {
                            db.dispatch(table._event + '.' + prop + '.' + ndx + '.read', {
                                value: select[prop]
                            });
                        }
                    }
                }
            }

            return response;
        };

        var makeValid = function (returnArrays, validIndices) {
            var columnName;

            for (columnName in returnArrays) {
                if (returnArrays.hasOwnProperty(columnName)) {
                    returnArrays[columnName] = returnArrays[columnName].filter(function (v, i) {
                        return validIndices.indexOf(i) !== -1;
                    });
                }
            }

            return returnArrays;
        };

        var getDistinctIndices = function (a) {
            var cache = [], keep = [];

            a.filter(function (v, i) {
                if (cache.indexOf(v) === -1 && v !== null) {
                    cache.push(v);
                    keep.push(i);
                    return true;
                }
            });

            return keep;
        };

        var toJsonArray = function (returnArrays) {
            var arr = [], columnName, column, len, i;

            for (columnName in returnArrays) {
                if (returnArrays.hasOwnProperty(columnName)) {
                    column = returnArrays[columnName];
                    len = column.length;
                    for (i = 0; i < len; ++i) {
                        if (!arr[i]) {
                            arr[i] = {};
                        }
                        arr[i][columnName] = column[i];
                    }
                }
            }

            return arr;
        };

        return go;
    }());

    /*
     * Select.js
     */
    var Select = (function() {
        'use strict';

        var QueryObject = function (selects) {
            this.selects = selects;
        };

        QueryObject.prototype = {
            'db': undefined,
            'distinct': false,
            'selects': [],
            'table': undefined,
            'where': undefined
        };

        var Where = function (queryObject, column, comparator, control) {
            this._queryObject = queryObject;
            queryObject.where = {
                'initial': [column, comparator, control],
                'and': [],
                'or': []
            };
        };

        Where.prototype = {
            'and': function (column, comparator, control) {
                this._queryObject.where.and.push([column, comparator, control]);

                return this;
            },
            'or': function (column, comparator, control) {
                this._queryObject.where.or.push([column, comparator, control]);

                return this;
            },
            'go': function () {
                return go(this._queryObject);
            },
            'GO': function () {
                return go(this._queryObject);
            }
        };

        var where = function (column, comparator, control) {
            return new Where(this._queryObject, column, comparator, control);
        };

        var From = function (queryObject, tableName) {
            this._queryObject = queryObject;
            this._table = queryObject.db[tableName];
            queryObject.table = this._table;
        };

        var from = function (tableName) {
            return new From(this._queryObject, tableName);
        };

        From.prototype = {
            '_table': undefined,
            'where': function () {
                return where.apply(this, arguments);
            },
            'WHERE': function () {
                return where.apply(this, arguments);
            },
            'go': function () {
                return go(this._queryObject);
            },
            'GO': function () {
                return go(this._queryObject);
            }
        };

        var distinct = function (columnName) {
            var db = this._queryObject.db;

            this._queryObject = new QueryObject([columnName]);
            this._queryObject.distinct = columnName;
            this._queryObject.db = db;

            return this;
        };

        var Select = function (db, selects) {
            this._queryObject = new QueryObject(selects || '*');
            this._queryObject.db = db;

            return this;
        };

        Select.prototype = {
            '_queryObject': {},
            'from': function () {
                return from.apply(this, arguments);
            },
            'FROM': function () {
                return from.apply(this, arguments);
            },
            'distinct': function (/*columnNames*/) {
                return distinct.apply(this, arguments);
            },
            'DISTINCT': function (/*columnNames*/) {
                return distinct.apply(this, arguments);
            }
        };

        return Select;
    }());

    /* Prepare Object to Expose Framework */
    return {
        Box: box,
        eventHub: eventHub,
        lobro: lobro,
        request: request,
        temple: temple,
        db: squaredb
    };

}());
