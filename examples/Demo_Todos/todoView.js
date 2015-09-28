define(['temple', 'todoController'], function (temple, todoController) {
    return new Promise(function (resolve, reject) {
        temple.getTemplate('todos.html').then(function (view) {
            todoController.then(function (model) {
                view = temple.toDom(view, model);

                resolve(view);
            });
        });
    });
});