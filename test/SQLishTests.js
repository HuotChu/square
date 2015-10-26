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
                    query = db.select('title').from('Books').go();
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

                    titlesArray = db.select('title').from('Books').go();
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
                    query = db.select('title').from('Books').where('title', '===', 'Aliens').go();
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
                    returnSet = where('title', 'like', 'soup').go();
                    passedTest = returnSet.length === 0;
                    if (passedTest) {
                        returnSet = where('title', 'like', '.*soup').go();
                        passedTest = returnSet.length === 1 && returnSet[0].title === 'Alphabet Soup';
                    }
                    if (passedTest) {
                        returnSet = where('title', 'like', 'ba.*').go();
                        passedTest = returnSet.length === 2 && returnSet[0].title === 'Baseball' && returnSet[1].title === 'Bats';
                    }
                    if (passedTest) {
                        returnSet = where('title', 'like', '.*ou.*ou.*').go();
                        passedTest = returnSet.length === 1 && returnSet[0].title === 'Soup for the Soul';
                    }
                    harness.assert_true(passedTest);
                    // do not tear down Library
                }, "SELECT title FROM Books WHERE title LIKE %ou%ou%  => plus 3 more 'LIKE' tests");


                harness.test(function () {
                    var where = query.where,
                        returnSet,
                        passedTest = false;

                    returnSet = where('title', 'not like', '.*b.*').go();
                    passedTest = returnSet.length === 3 && returnSet[0].title === 'Aliens' && returnSet[1].title === 'Cats' && returnSet[2].title === 'Soup for the Soul';
                    harness.assert_true(passedTest);
                    // do not tear down Library
                }, "SELECT title FROM Books WHERE title NOT LIKE %b%");


                harness.test(function () {
                    query = db.select('*').from('Books').go();
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
                                                                    ('Coffee Break', 'Bob Aaron')('Bats', 'Creepy Guy')('Cats', 'Kaitlyn Rose')
                                                                    ('Soup for the Soul', 'Flora Ivy');
                    returnSet = db.select('title').from('Books').where('author', 'like', '.*o.*s.*').go();
                    testPassed = returnSet.length === 2 && returnSet[0].title === 'Alphabet Soup' && returnSet[1].title === 'Cats';
                    harness.assert_true(testPassed);
                    // do not tear down Library
                }, "SELECT title FROM Books WHERE author LIKE %o%s%  => condition based on field not in SELECT");


                harness.test(function () {
                    db.update('Books').set('title', 'Green Eggs & Ham')('author', 'Dr. Seuss').where('title', '===', 'Bats').go();
                    query = db.select('title', 'author').from('Books').go();
                    harness.assert_true(query.length === 7 && query[4].title === 'Green Eggs & Ham' && query[4].author === 'Dr. Seuss');
                    //db = SQLish.dropDB('Library');
                }, "UPDATE Books SET title = 'Green Eggs & Ham', author = 'Dr. Seuss' WHERE title = 'Bats'");


                harness.test(function() {
                    query = db.select('title').from('Books').where('title', 'like', '.*break').and('author', 'like', '.*Aaron').go();
                    harness.assert_true(query[0].title === 'Coffee Break');
                }, "SELECT title FROM Books WHERE title like %break AND author like %Aaron");


                harness.test(function() {
                    query = db.select('title').from('Books').where('title', '===', 'Aliens').or('author', '===', 'Kaitlyn Rose').go();
                    harness.assert_true(query.length === 2 && query[0].title === 'Aliens' && query[1].title === 'Cats');
                }, "SELECT title FROM Books WHERE title = 'Aliens' OR author = 'Kaitlyn Rose'");


                harness.test(function() {
                    db.deleteFrom('Books').where('author', '===', 'Hank Aaron').or('author', 'like', '.*ivy').go();
                    query = db.select('title', 'author').from('Books').where('author', '===', 'Hank Aaron').or('author', 'like', '.*ivy').go();
                    harness.assert_true(query.length === 0);
                }, "DELETE FROM Books WHERE author === 'Hank Aaron' OR author like %ivy");


                harness.test(function() {
                    db.deleteFrom('Books').go();
                    query = db.select('title', 'author').from('Books').go();
                    harness.assert_true(query.length === 0);
                }, "DELETE FROM Books");


                harness.test(function() {
                    db.delete('author').from('Books');
                    query = db.select('author').from('Books').go();
                    harness.assert_true(db.Books.author === undefined && query.length === 0);
                }, "DELETE author FROM Books");


                // setup for next test
                db = SQLish.createDB('Library');
                table = db.createTable('Books')('title', 'author');
                db.insertInto('Books')('title', 'author').values('Baseball', 'Hank Aaron')('Alphabet Soup', 'Abe Jones')('Aliens', 'Corey Dorey')
                ('Coffee Break', 'Bob Aaron')('Bats', 'Creepy Guy')('Cats', 'Kaitlyn Rose')
                ('Soup for the Soul', 'Flora Ivy');

                harness.test(function() {
                    db.delete('*').from('Books');
                    var q1 = db.select('title').from('Books').go(),
                        q2 = db.select('author').from('Books').go();

                    console.log('DB', db);
                    harness.assert_true(db.Books.author === undefined && db.Books.title === undefined && q1.length === 0 && q2.length === 0);
                }, "DELETE * FROM Books");
            }
        };
    }
);
