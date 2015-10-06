/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(function() {
    'use strict';

    var _storage = {
        /*
           'amazon': {    // model or DB name
             'books': {   // collection or table name
                'j$_validate': {    // dataObjects within the 'books' collection will use these to validate
                    'book-id': /[\d\w\-]+/i,
                    'book-title': /[\w\d\-_\s'\.\?!&]{2,60}/i,
                    'book-price': /^\$\d{1,9}\.\d{2}$/i
                },
                    // the data structure looks like this... or it can be further nested in [sub] collections
                    // unique keys are automatically generated for a plain array of objects
                'CF10239843-fr987': {   // SQLish dataObject => SQL primary key val or Object name
                    'data': {
                        'book-id': 'CF10239843-fr987',    // SQL row name or Object property
                        'book-title': 'One Flew Over the Cuckoo\'s Nest',
                        'book-price': '$15.00'
                    }
                },
                '555-abc-12-us54323': {
                    'data': {
                        'book-id': '555-abc-12-us54323',
                        'book-title': 'Tommy Knockers',
                        'book-price': '$29.95'
                    }
                },
                'KF0009878US': {
                    'data': {
                        'book-id': 'KF0009878US',
                        'book-title': 'One Fish Two Fish Red Fish Blue Fish',
                        'book-price': '$29.95'
                    }
                },
                'j$_objectArray': [   // dataArray created by SQLish! => pointers to the objects above
                    {CF10239843-fr987}, {555-abc-12-us54323}, {KF0009878US}
                ]
             }
           }
        */
    };
});