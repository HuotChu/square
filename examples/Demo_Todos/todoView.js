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
                        todo = temple.getTemplate('todo.html', true),
                        dataObj = model.add('todos', {title: val, done: false, id: ++last});

                    e.preventDefault();
                    e.stopPropagation();

                    todo.then(function (todoDom) {
                        var baseNode = document.querySelector('#todo-list');

                        baseNode.appendChild(temple.toDom(todoDom, dataObj));
                        newTodo.value = '';
                    });
                });

                model.register('removeTodo', 'click', function (e) {
                    var target = e.target.offsetParent,
                        id = target.id.replace(/^todo\-/, '');

                    model.remove('todos', 'isEqual', ['id', id]);
                    target.parentElement.removeChild(target);
                });

                view = temple.toDom(view, model);

                resolve(view);
            });
        });
    });
});