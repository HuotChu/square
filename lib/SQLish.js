/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['./eventHub'], function(eventHub) {
    'use strict';

    var model = {}; // stub for model

    eventHub.connect(model);

    var DataCollection = window.DataCollection = function DataCollection () {};

    DataCollection.prototype = {
        '_name': '',
        '_initialized': false,
        '_valid': {},
        '_model': undefined,
        'lastIndex': -1,                // the last index assigned
        'add': function (dataObj) {
            var index = ++this.lastIndex + '',
                detail = {},
                newObj = dataObj,
                name = this._name;

            this.lastIndex = index;

            if (!(dataObj instanceof DataObject)) {
                newObj = new DataObject();
                newObj.set(dataObj, false, true);
            }

            this[index] = dataObj;
            detail.type = 'add';
            detail.value = newObj;
            detail.target = this;

            if (name) {
                newObj._name = name + '.' + index;
                name = newObj._name;
                model.dispatch(name, detail);
            }

            return name; // path to listen to for changes to the inserted object
        },
        'drop': function (objName) {  // {String} Usually numeric index/id assigned to the object
            var detail = {},
                clone = this[objName],
                name = this._name;

            this[objName] = null;
            delete this[objName];
            detail.type = 'drop';
            detail.value = clone;
            detail.target = this;

            if (name) {
                name += '.' + objName;
            }

            return name;  // path to remove listeners from
        },
        // Query Methods
        /*
         * o should be an object with the following properties:
         * (select and from are required, the rest are optional)
         * {
         *     'select':   // *** <column selection> list of property names to return values for or * all columns
         *     'from':     // *** table(s) to retrieve data from    <= this is the current object <DataCollection>
         *     'distinct': // true or false (default)
         *     'join':     // type of join to perform
         *     'where':    // condition to eliminate unwanted data
         *     'group':    // column name(s) to group by?
         *     'having':   // condition to filter return from 'group'
         *     'order':    // column to sort on and sort direction/algorithm
         * }
         */
        'query': function (queryObj) {
            var select = queryObj['select'] || [],   // fields to return, i.e. return ['author', 'shipping.weight']
                distinct = !!queryObj['distinct'],
                join = queryObj['join'],
                where = queryObj['where'] || [],
                group = queryObj['group'],
                having = queryObj['having'],
                order = queryObj['order'],
                results = new DataCollection();


        }
    };

    var _storage = {
        /*
           'amazon': {    // model or DB name
             'books': {   // collection or table name
                '_valid': {    // dataObjects within the 'books' collection will use these to validate                <= __proto__
                    'book-id': /[\d\w\-]+/i,
                    'book-title': /[\w\d\-_\s'\.\?!&]{2,60}/i,
                    'book-price': /^\$\d{1,9}\.\d{2}$/i
                },
                    // the data structure looks like this... or it can be further nested in [sub] collections
                    // unique keys are automatically generated for a plain array of objects
                '0': {   // SQLish dataObject => SQL primary key val or Object name
                    'value': {
                        'book-id': 'CF10239843-fr987',    // SQL row name or Object property
                        'book-title': 'One Flew Over the Cuckoo\'s Nest',
                        'book-price': '$15.00'
                    }
                },
                '1': {
                    'value': {
                        'book-id': '555-abc-12-us54323',
                        'book-title': 'Tommy Knockers',
                        'book-price': '$29.95'
                    }
                },
                '2': {
                    'value': {
                        'book-id': 'KF0009878US',
                        'book-title': 'One Fish Two Fish Red Fish Blue Fish',
                        'book-price': '$29.95'
                    }
                },
                '_indices': {                                                                                         <= __proto__
                    '_indexedCollection': true,     // use number-as-string indices <true> or pointer arrays <false>
                    '_lastIndex': 2,                // the last NEW index assigned
                    '_recycle': false,              // use recycled indices? defaults to false
                    '_recycleBin': [],              // store deleted indexes here and retrieve before using new indices
                    'book-id': [          // pointer array
                         ['CF10239843-fr987', '0'],
                         ['555-abc-12-us54323', '1'],
                         ['KF0009878US', '2']
                    ],
                    'book-title': [       // pointer array
                         ['One Flew Over the Cuckoo\'s Nest', '0'],
                         ['Tommy Knockers', '1'],
                         ['One Fish Two Fish Red Fish Blue Fish', '2']
                    ]
                }
             }
           }
        */
    };

    return {model: model};
});