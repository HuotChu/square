define(['temple', 'notify', 'todoModel'], function (temple, notify, todoModel) {
    return new Promise(function (resolve, reject) {

            todoModel.then(function (model) {
                model.register('publisher', 'click', notify.publisher);
                // model.spy(functionName, function) adds a model event listener (aka data-bind) to a model dataSpy event
                // data spy functions respond to model events => function (changedVal, updateEvent, dataPath, model)
                //                                            => "this" inside the callback will be the domNode that is data-bound
                // data-spy tags link the data denoted in the path to the desired model event. Elements with this tag are passed to the spy.
                // data-event tags link the handler to one of the following model events: 'change', 'add', 'update', 'remove'
                // data-handler tags match a model spy to the correct model event and handler

                model.spy('updateTodoList', function (changedVal) {
                    var todo = temple.getTemplate('todo.html', true);

                    todo.then(function (dom) {
                        this.offsetParent.appendChild(temple.toDom(dom, changedVal));
                    }.bind(this));
                });

                // model.register(functionName, domEvent, function) adds a dom event listener to a data-dom element
                // data-dom functions respond to dom events => function (event)

                model.register('addTodo', 'submit', function (e) {
                    var textField = model._domDataNodes.getNode('todo-input').node,
                        val = textField.value,
                        todos = model.getNodeFromPath('todos'),
                        last = todos[todos.length - 1].get('id');

                    e.preventDefault();
                    e.stopPropagation();

                    todos.add({title: val, done: false, id: ++last});
                    textField.value = '';
                    textField.focus();
                });

                model.register('removeTodo', 'click', function (e) {
                    var target = e.target.offsetParent,
                        id = target.id.replace(/^todo\-/, '');

                    model.remove('todos', 'isEqual', ['id', id]);
                    target.parentElement.removeChild(target);
                });

                resolve(model);
            });

    });
});