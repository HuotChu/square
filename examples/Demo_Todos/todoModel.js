define(['model', 'notify'], function (model, notify) {
    'use strict';
    return new Promise(function (resolve, reject) {
        var todoModel = model.create('todoModel', {
                // enhance the model to deal with our data more conveniently
                getAllPending: function () {
                    // return all todos where done === false
                    return model.getNodeFromPath('todos').query('notEqual', ['done', true]).found;
                },

                getAllComplete: function () {
                    // return all todos where done === true
                    return model.getNodeFromPath('todos').query('isEqual', ['done', true]).found;
                },

                remainingCount: function () {
                    return model.getNodeFromPath('todos').length;
                }
            });

        // create a named data array and insert into the model
        var dataArray = todoModel.newDataArray('todos', '');

        // copy the data array we got from the server in the dataArray we just made
        // this will convert all the data into dataObjects and add query to the array
        // ...since there is no server data, we'll use a mock
        dataArray.cloneArray([
            {
                title: 'Sample Todo #1',
                done: false,
                id: 1
            },
            {
                title: 'Sample Todo #2',
                done: false,
                id: 2
            }
        ]);

        resolve(todoModel);
    });
});