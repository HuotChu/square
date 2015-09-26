define(['model'], function (model) {
    'use strict';
    return new Promise(function (resolve, reject) {
        var todoModel = model.create('todoModel', {
                // enhance the model to deal with our data more conveniently

            getAllPending: function () {
                // return all todos where done === false
                return this.selectAll('todos', function (o) {
                    return !o.done ? o : false;
                });
            },

            getAllComplete: function () {
                // return all todos where done === true
                return this.selectAll('todos', function (o) {
                    return o.done ? o : false;
                });
            },

            remainingCount: function () {
                return this.todos.length;
            },

            remainingText: ' todos remaining'

        });

        model.insert('todos', [
            {
                title: 'Sample Todo #1...',
                done: false
            },
            {
                title: 'Sample Todo #2',
                done: false
            }
        ], null, 'todoModel');

        resolve(todoModel);
    });
});