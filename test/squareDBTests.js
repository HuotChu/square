/**
 * Created by Scott on 2/25/2015.
 */
define(['testharness', '../lib/request', '../lib/squaredb/squaredb'],
    function(harness, request, squareDB) {
        return {
            run: function () {
                "use strict";

                var db, table, query;

                harness.test(function () {
                    db = squareDB.createDB('Library');
                    harness.assert_true(squareDB.use('Library') !== undefined);
                }, "CREATE DATABASE Library  => happens in each test, checking here");


                harness.test(function () {
                    db = squareDB.dropDB('Library');
                    harness.assert_true(db && squareDB.use('Library') === undefined);
                }, "DROP DATABASE Library  => happens in each test, checking here");


                harness.test(function () {
                    db = squareDB.createDB('Library');
                    table = db.createTable('Books')('title');
                    harness.assert_true(table.hasOwnProperty('title'));
                }, "CREATE TABLE Books (title)");


                // tear-down & setup for next test
                db = squareDB.dropDB('Library');
                db = squareDB.createDB('Library');

                harness.test(function () {
                    db.createTable('Books')('title');
                    db.insertInto('Books')('title').values('Book of Foo');
                    query = db.select('title').from('Books').go();
                    harness.assert_true(query[0].title === 'Book of Foo');
                }, "INSERT INTO Books (title) VALUES ('Book of Foo')");


                // tear-down & setup for next test
                db = squareDB.dropDB('Library');
                db = squareDB.createDB('Library');
                table = db.createTable('Books')('title');

                harness.test(function () {
                    var testPassed,
                        titlesArray;

                    db.insertInto('Books')('title').values('Alphabet Soup')('Aliens')('Baseball')('Bats')('Cats')('Soup for the Soul');
                    titlesArray = db.select('title').from('Books').go();
                    testPassed = titlesArray.every(function (rowObj) {
                        var title = rowObj.title,
                            a = ['Alphabet Soup', 'Aliens', 'Baseball', 'Bats', 'Cats', 'Soup for the Soul'];

                        return title && a.indexOf(title) >= 0;
                    });
                    harness.assert_true(testPassed);
                }, "INSERT INTO Books (title) VALUES ('Alphabet Soup'),('Aliens'),('Baseball'),('Bats'),('Cats'),('Soup for the Soul')");


                // next test uses prerequisites from previous test...
                harness.test(function () {
                    query = db.select('title').from('Books').where('title', '===', 'Aliens').go();
                    harness.assert_true(query[0] && query[0].title === 'Aliens');
                }, "SELECT title FROM Books WHERE title = 'Aliens'");


                // keep going...
                harness.test(function () {
                    var passedTest;

                    query = db.select('title').from('Books').where('title', 'like', 'soup').go();
                    passedTest = query.length === 0;
                    if (passedTest) {
                        query = db.select('title').from('Books').where('title', 'like', '.*soup').go();
                        passedTest = query.length === 1 && query[0].title === 'Alphabet Soup';
                    }
                    if (passedTest) {
                        query = db.select('title').from('Books').where('title', 'like', 'ba.*').go();
                        passedTest = query.length === 2 && query[0].title === 'Baseball' && query[1].title === 'Bats';
                    }
                    if (passedTest) {
                        query = db.select('title').from('Books').where('title', 'like', '.*ou.*ou.*').go();
                        passedTest = query.length === 1 && query[0].title === 'Soup for the Soul';
                    }
                    harness.assert_true(passedTest);
                }, "SELECT title FROM Books WHERE title LIKE %ou%ou%  => plus 3 more 'LIKE' tests");


                harness.test(function () {
                    var passedTest;

                    query = db.select('title').from('Books').where('title', 'not like', '.*b.*').go();
                    passedTest = query.length === 3 && query[0].title === 'Aliens' && query[1].title === 'Cats' && query[2].title === 'Soup for the Soul';
                    harness.assert_true(passedTest);
                }, "SELECT title FROM Books WHERE title NOT LIKE %b%");


                harness.test(function () {
                    query = db.select('*').from('Books').go();
                    harness.assert_true(query.length === 6);
                }, "SELECT * FROM Books");


                // tear-down & setup for next test
                db = squareDB.dropDB('Library');
                db = squareDB.createDB('Library');
                table = db.createTable('Books')('title', 'author');

                harness.test(function () {
                    var testPassed, returnSet;

                    db.insertInto('Books')('title', 'author').values('Baseball', 'Hank Aaron')('Alphabet Soup', 'Abe Jones')('Aliens', 'Abe Jones')
                        ('Coffee Break', 'Bob Aaron')('Bats', 'Wes Stacks')('Cats', 'Kaitlyn Rose')('Soup for the Soul', 'Flora Ivy');
                    returnSet = db.select('author').from('Books').where('author', 'like', '.*o.*s.*').go();
                    testPassed = returnSet.length === 3 && returnSet[0]['author'] === 'Abe Jones' && returnSet[1]['author'] === 'Abe Jones' && returnSet[2]['author'] === 'Kaitlyn Rose';
                    harness.assert_true(testPassed);
                }, "SELECT title FROM Books WHERE author LIKE %o%s%  => condition based on field not in SELECT");


                harness.test(function () {
                    var returnSet = db.select().distinct('author').from('Books').where('author', '===', 'Abe Jones').go(),
                        testPassed;
                    console.log('returnSet', returnSet);
                    testPassed = returnSet.length === 1 && returnSet[0]['author'] === 'Abe Jones';
                    harness.assert_true(testPassed);
                }, "SELECT DISTINCT author FROM Books WHERE author = 'Abe Jones'");


                harness.test(function () {
                    db.update('Books').set('title', 'Green Eggs & Ham')('author', 'Dr. Seuss').where('title', '===', 'Bats').go();
                    query = db.select('title', 'author').from('Books').go();
                    harness.assert_true(query.length === 7 && query[4].title === 'Green Eggs & Ham' && query[4]['author'] === 'Dr. Seuss');
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
                    var d = db.delete().from('Books').where('author', '===', 'Hank Aaron').or('author', 'like', '.*ivy').go();
                    query = db.select('title', 'author').from('Books').where('author', '===', 'Hank Aaron').or('author', 'like', '.*ivy').go();
                    harness.assert_true(query.length === 0);
                }, "DELETE FROM Books WHERE author === 'Hank Aaron' OR author like %ivy");


                // tear-down & setup for next test
                db = squareDB.dropDB('Library');
                db = squareDB.createDB('Library');
                table = db.createTable('Books')('title', 'author');
                db.insertInto('Books')('title', 'author').values('Baseball', 'Hank Aaron')('Alphabet Soup', 'Abe Jones')('Aliens', 'Corey Dorey')
                    ('Coffee Break', 'Bob Aaron')('Bats', 'Creepy Guy')('Cats', 'Kaitlyn Rose')('Soup for the Soul', 'Flora Ivy');

                harness.test(function() {
                    var d = db.delete('author').from('Books').go();
                    query = db.select('author').from('Books').go();
                    harness.assert_true(query.length === 0);
                }, "DELETE author FROM Books");


                // tear-down & setup for next test
                db = squareDB.dropDB('Library');
                db = squareDB.createDB('Library');
                table = db.createTable('Books')('title', 'author');
                db.insertInto('Books')('title', 'author').values('Baseball', 'Hank Aaron')('Alphabet Soup', 'Abe Jones')('Aliens', 'Corey Dorey')
                    ('Coffee Break', 'Bob Aaron')('Bats', 'Creepy Guy')('Cats', 'Kaitlyn Rose')('Soup for the Soul', 'Flora Ivy');

                harness.test(function() {
                    var d = db.delete('*').from('Books').go();  // same as db.delete().from('Books').go();
                    var q1 = db.select('title').from('Books').go(),
                        q2 = db.select('author').from('Books').go();

                    harness.assert_true(q1.length === 0 && q2.length === 0);
                }, "DELETE * FROM Books => same as DELETE FROM Books");


                // tear-down & setup for next test
                db = squareDB.dropDB('Library');
                db = squareDB.createDB('Library');
                table = db.createTable('Books')('title', 'author');
                db.insertInto('Books')('title', 'author').values('Baseball', 'Hank Aaron')('Alphabet Soup', 'Abe Jones')('Aliens', 'Corey Dorey')
                    ('Coffee Break', 'Bob Aaron')('Bats', 'Creepy Guy')('Cats', 'Kaitlyn Rose')('Soup for the Soul', 'Flora Ivy');

                harness.test(function() {
                    db.alterTable('Books').add('pages');
                    query = db.select('pages').from('Books').go();
                    harness.assert_true(query.length === 7);
                }, "ALTER TABLE Books ADD pages");


                harness.test(function() {
                    db.alterTable('Books').drop('pages');
                    query = db.select('pages').from('Books').go();
                    console.log('table', table);
                    harness.assert_true(query.length === 0);
                }, "ALTER TABLE Books DROP pages");


                // tear-down & setup for next test
                db = squareDB.dropDB('Library');
                db = squareDB.createDB('Library');
                table = db.createTable('Books')('title', 'author', 'pages');
                db.insertInto('Books')('title', 'author', 'pages').values('Baseball', 'Hank Aaron', 1200)('Alphabet Soup', 'Abe Jones', 540)('Aliens', 'Corey Dorey', 210)
                    ('Coffee Break', 'Bob Aaron', 65)('Bats', 'Creepy Guy', 300)('Cats', 'Kaitlyn Rose', 829)('Soup for the Soul', 'Flora Ivy', 1200);

                harness.test(function() {
                    query = db.select().min('pages').from('Books').go();
                    harness.assert_true(query['pages'] === 65);
                }, "SELECT MIN('pages') FROM Books");


                harness.test(function() {
                    query = db.select().max('pages').from('Books').go();
                    harness.assert_true(query['pages'] === 1200);
                }, "SELECT MAX('pages') FROM Books");


                harness.test(function() {
                    query = db.select().sum('pages').from('Books').go();
                    harness.assert_true(query['pages'] === 3234);
                }, "SELECT SUM('pages') FROM Books");


                harness.test(function() {
                    query = db.select().avg('pages').from('Books').go();
                    harness.assert_true(query['pages'] === 462);
                }, "SELECT AVG('pages') FROM Books");


                harness.test(function() {
                    query = db.select().count('title').from('Books').go();
                    harness.assert_true(query['title'] === 7);
                }, "SELECT COUNT('title') FROM Books");


                harness.test(function() {
                    // total all not null rows in all columns inside this table
                    query = db.select().count('*').from('Books').go();
                    harness.assert_true(query === 21);
                }, "SELECT COUNT(*) FROM Books");


                harness.test(function() {
                    query = db.select('title').min('pages').from('Books').go();
                    console.log('Test 26', query);
                    harness.assert_true(query['title'] === 'Coffee Break');
                }, "SELECT title, COUNT(pages) FROM Books");

            }
        };
    }
);
