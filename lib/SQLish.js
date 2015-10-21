/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['./eventHub'], function(eventHub) {
    'use strict';

    var db = function (modelName) {
        db[modelName] = eventHub.connect(new Model(modelName));
        db[modelName].event = modelName;

        return db[modelName];
    };

    db.prototype.drop = function (modelName) {
        if (this[modelName]) {
            this[modelName] = null;
            delete this[modelName];

            return true;
        }

        return false;
    };

    var Model = function (modelName) {
        this.event = modelName;
    };

    Model.prototype = {
        'event': '',
        'add': function (collectionName) {
            var dataArr = new DataCollection(collectionName),
                path = this.event,
                detail;

            dataArr._model = this;
            dataArr.event = path + '.' + collectionName;
            this[collectionName] = dataArr;
            detail = {
                'target': this,
                'type': 'add',
                'value': dataArr
            };
            this.dispatch(path, detail);

            return dataArr;
        }
    };

    //sample Model
        /*
           'LibraryModel': {    // model or DB name
             'BooksCollection': [   // collection or table name
                '_valid': {    // dataObjects within the 'books' collection will use these to validate      <= __proto__
                    'book-id': /[\d\w\-]+/i,
                    'book-title': /[\w\d\-_\s'\.\?!&]{2,60}/i,
                    'book-price': /^\$\d{1,9}\.\d{2}$/i
                },
                '_required': {  //       <= __proto__
                    'book-id': true,
                    'book-title:' true,
                    'book-price': true,
                    'book-author': false  // not required - assumed false if not implicitly set to true
                },
        // the data structure looks like this... or it can be further nested in [sub] collections
                {  // jato DataObject
                    'value': {
                        'book-id': 'CF10239843-fr987',    // SQL row name or Object property
                        'book-title': 'One Flew Over the Cuckoo\'s Nest',
                        'book-price': '$15.00'
                    }
                },
                {
                    'value': {
                        'book-id': '555-abc-12-us54323',
                        'book-title': 'Maximum Overdrive',
                        'book-price': '$29.95',
                        'book-author': 'Stephen King'
                    }
                },
                {
                    'value': {
                        'book-id': 'KF0009878US',
                        'book-title': 'One Fish Two Fish Red Fish Blue Fish',
                        'book-price': '$19.95'
                    }
                }
             ]
           }
        */

    return db;
});