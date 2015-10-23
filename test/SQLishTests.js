/**
 * Created by Scott on 2/25/2015.
 */
define(['testharness', '../lib/request', '../lib/SQLish'],
    function(harness, request, SQLish) {
        var mockData = [
            {
                'book-id': 'CF10239843-fr987',
                'book-title': 'One Flew Over the Cuckoo\'s Nest',
                'book-price': '$15.00'
            },
            {
                'book-id': '555-abc-12-us54323',
                'book-title': 'Maximum Overdrive',
                'book-price': '$29.95',
                'book-author': 'Stephen King'
            },
            {
                'book-id': 'KF0009878US',
                'book-title': 'One Fish Two Fish Red Fish Blue Fish',
                'book-price': '$19.95'
            }
        ];

        return {
            run: function () {
                "use strict";

                var db;

                // Create a database called Library
                harness.test(function () {
                    db = SQLish.createDB('Library');

                    harness.assert_true(SQLish.getDB('Library') !== undefined);
                }, "SQLish should return a database called Library.");

                // Create a table and tell it the rows to create
                harness.test(function () {
                    var table = db.createTable('Books', ['title']);

                    harness.assert_true(table.hasOwnProperty('title'));
                }, "Library should contain a Books table with a row named title.");

                // Place mock data into a collection on the model
               /* harness.test(function () {
                    var model = M('LibraryModel'),
                        collection = model.add('BooksCollection');

                    collection.add(mockData);

                    harness.assert_true(model['BooksCollection'].every(function (book, i) {
                        return book instanceof DataObject && book.get() === mockData[i];
                    }));
                }, "Model should contain 3 objects from mock data converted to JATO DataObjects");*/
            }
        };
    }
);