/**
 * Created by Scott on 2/25/2015.
 */
define(['testharness', '../lib/request', '../lib/SQLish'],
    function(harness, request, M) {
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

                // Create a model test
                harness.test(function () {
                    var model = M('LibraryModel');

                    harness.assert_true(model.event === 'LibraryModel');
                }, "Model should be an object with event named LibraryModel");

                // Create a collection object and put it in the model, then retrieve it
                harness.test(function () {
                    var model = M('LibraryModel');

                    model.add('BooksCollection');

                    harness.assert_true(model['BooksCollection']['event'] === 'LibraryModel.BooksCollection');
                }, "Model should have a new collection object with event LibraryModel.BooksCollection");
            }
        };
    }
);