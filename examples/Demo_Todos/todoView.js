define(['temple', 'notify', 'todoModel'], function (temple, notify, todoModel) {
    return new Promise(function (resolve, reject) {
        temple.getTemplate('todo.html').then(function (view) {
            todoModel.then(function (model) {
                model.register('publisher', 'click', notify.publisher);

                model.register('addTodo', 'submit', function () {
                    var newTodo = document.querySelector('#new-todo').value;

                    model.add('todos', {title: newTodo, done: false});
                });

                view = temple.toDom(view, model);

                resolve(view);
            });
        });
    });
});