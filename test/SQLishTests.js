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
                }, "CREATE DATABASE Library  => happens in each test, checking here");


                harness.test(function () {
                    db = SQLish.dropDB('Library');
                    harness.assert_true(db && SQLish.getDB('Library') === undefined);
                }, "DROP DATABASE Library  => happens in each test, checking here");


                harness.test(function () {
                    db = SQLish.createDB('Library');
                    table = db.createTable('Books')('title');
                    harness.assert_true(table.hasOwnProperty('title'));
                    db = SQLish.dropDB('Library');
                }, "CREATE TABLE Books (title)");


                harness.test(function () {
                    db = SQLish.createDB('Library');
                    db.createTable('Books')('title');
                    db.insertInto('Books')('title').values('Book of Foo');
                    query = db.select('title').from('Books')();
                    harness.assert_true(query[0].title === 'Book of Foo');
                    db = SQLish.dropDB('Library');
                }, "INSERT INTO Books (title) VALUES ('Book of Foo')");


                // setup for next test
                db = SQLish.createDB('Library');
                table = db.createTable('Books')('title');

                harness.test(function () {
                    var insertValues = db.insertInto('Books')('title').values('Alphabet Soup')('Aliens')('Baseball')('Bats')('Cats')('Soup for the Soul'),
                        testPassed = false,
                        titlesArray;

                    titlesArray = db.select('title').from('Books')();
                    testPassed = titlesArray.every(function (rowObj) {
                        var title = rowObj.title,
                            a = ['Alphabet Soup', 'Aliens', 'Baseball', 'Bats', 'Cats', 'Soup for the Soul'];

                        return title && a.indexOf(title) >= 0;
                    });
                    harness.assert_true(testPassed);
                    // do not tear down Library
                }, "INSERT INTO Books (title) VALUES ('Alphabet Soup'),('Aliens'),('Baseball'),('Bats'),('Cats'),('Soup for the Soul')");


                // next test uses prerequisites from previous test...
                harness.test(function () {
                    query = db.select('title').from('Books').where('title', '===', 'Aliens');
                    harness.assert_true(query[0] && query[0].title === 'Aliens');
                    // do not tear down Library
                }, "SELECT title FROM Books WHERE title = 'Aliens'");


                // keep going...
                harness.test(function () {
                    var where,
                        returnSet,
                        passedTest = false;

                    query = db.select('title').from('Books');
                    where = query.where;
                    returnSet = where('title', 'like', 'soup');
                    passedTest = returnSet.length === 0;
                    if (passedTest) {
                        returnSet = where('title', 'like', '.*soup');
                        passedTest = returnSet[0].title === 'Alphabet Soup' && returnSet.length === 1;
                    }
                    if (passedTest) {
                        returnSet = where('title', 'like', 'ba.*');
                        passedTest = returnSet[0].title === 'Baseball' && returnSet[1].title === 'Bats' && returnSet.length === 2;
                    }
                    if (passedTest) {
                        returnSet = where('title', 'like', '.*ou.*ou.*');
                        passedTest = returnSet[0].title === 'Soup for the Soul' && returnSet.length === 1;
                    }
                    harness.assert_true(passedTest);
                    // do not tear down Library
                }, "SELECT title FROM Books WHERE title LIKE %ou%ou%  => plus 3 more 'LIKE' tests");


                harness.test(function () {
                    var where = query.where,
                        returnSet,
                        passedTest = false;

                    returnSet = where('title', 'not like', '.*b.*');
                    passedTest = returnSet[0].title === 'Aliens' && returnSet[1].title === 'Cats' && returnSet[2].title === 'Soup for the Soul' && returnSet.length === 3;
                    harness.assert_true(passedTest);
                    // do not tear down Library
                }, "SELECT title FROM Books WHERE title NOT LIKE %b%");


                harness.test(function () {
                    query = db.select('*').from('Books')();
                    harness.assert_true(query.length === 6);
                    db = SQLish.dropDB('Library');
                }, "SELECT * FROM Books");


                // setup for next test
                db = SQLish.createDB('Library');
                table = db.createTable('Books')('title', 'author');

                harness.test(function () {
                    var testPassed = false,
                        returnSet;

                    db.insertInto('Books')('title', 'author').values('Baseball', 'Hank Aaron')('Alphabet Soup', 'Abe Jones')('Aliens', 'Corey Dorey')
                                                                    ('Baseball', 'Hank Aaron')('Bats', 'Creepy Guy')('Cats', 'Kaitlyn Rose')
                                                                    ('Soup for the Soul', 'Flora Ivy');
                    returnSet = db.select('title').from('Books').where('author', 'like', '.*o.*s.*');
                    testPassed = returnSet[0].title === 'Alphabet Soup' && returnSet[1].title === 'Cats' && returnSet.length === 2;
                    harness.assert_true(testPassed);
                    // do not tear down Library
                }, "SELECT title FROM Books WHERE author LIKE %o%s%  => condition based on field not in SELECT");
            }
        };
    }
);
