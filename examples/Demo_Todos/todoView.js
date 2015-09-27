define(['temple', 'notify', 'todoModel'], function (temple, notify, todoModel) {
    return new Promise(function (resolve, reject) {
        temple.getTemplate('todos.html').then(function (view) {
            todoModel.then(function (model) {
                model.register('publisher', 'click', notify.publisher);

                model.register('addTodo', 'submit', function (e) {
                    var newTodo = document.querySelector('#new-todo'),
                        val = newTodo.value,
                        todos = model.getNodeFromPath('todos'),
                        last = todos[todos.length - 1].get('id'),
                        baseNode = document.querySelector('#todo-list'),
                        todo = temple.getTemplate('todo.html', true),
                        dataObj = model.add('todos', {title: val, done: false, id: ++last});

                    e.preventDefault();
                    e.stopPropagation();

                    todo.then(function (todoDom) {
                        baseNode.appendChild(temple.toDom(todoDom, dataObj));
                        newTodo.value = '';
                    });
                });

                view = temple.toDom(view, model);

                resolve(view);
            });
        });
    });
});