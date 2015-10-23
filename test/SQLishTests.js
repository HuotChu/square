/**
 * Created by Scott on 2/25/2015.
 */
define(['testharness', '../lib/request', '../lib/SQLish'],
    function(harness, request, SQLish) {
        return {
            run: function () {
                "use strict";

                var db, table, query;

                harness.test(function () {
                    db = SQLish.createDB('Library');
                    harness.assert_true(SQLish.getDB('Library') !== undefined);
                }, "SQLish should return a database called 'Library'");


                harness.test(function () {
                    db = SQLish.dropDB('Library');
                    harness.assert_true(db && SQLish.getDB('Library') === undefined);
                }, "SQLish should return true after calling dropDB on 'Library'");


                harness.test(function () {
                    db = SQLish.createDB('Library');
                    table = db.createTable('Books')('title');

                    harness.assert_true(table.hasOwnProperty('title'));
                }, "'Library' should contain a 'Books' table with a column named 'title'");


                harness.test(function () {
                    table = db.insertInto('Books')('title').values('The Book of Foo');
                    query = db.select('title').from('Books');

                    harness.assert_true(query.return[0].title === 'The Book of Foo');
                }, "'title' column of 'Books' should contain 'The Book of Foo' at index 0");


                harness.test(function () {
                    var addValues = db.insertInto('Books')('title');

                    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(function(el) {
                        addValues.values(el);
                    });
                    harness.assert_true(db.Books.title.length === 11);
                }, "'title' column of 'Books' should contain values 1 through 10.");


                // next test...
            }
        };
    }
);
