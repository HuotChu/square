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

                harness.test(function () {
                    db = SQLish.createDB('Library');
                    console.log('db', db);
                    harness.assert_true(SQLish.getDB('Library') !== undefined);
                }, "SQLish should return a database called Library.");

                harness.test(function () {
                    var table = db.createTable('Books')('title');
                    console.log('table', table);
                    harness.assert_true(table.hasOwnProperty('title'));
                }, "Library should contain a Books table with a row named title.");

                harness.test(function () {
                    var table = db.insertInto('Books')('title').values('The Book of Foo');
                    console.log('table', table);
                    harness.assert_true(db.Books.title[0] === 'The Book of Foo');
                }, "Books table should contain mock data at path db.Books.title[0]");

            }
        };
    }
);