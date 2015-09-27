define(['todoView'], function (view) {
    var app = {};

    // app.startup is called by require.js in the config callback (index.html) to launch the app
    app.startup = function () {
        // reference the BODY node to add new nodes to later
        var baseNode = document.querySelector('body');

        // add the module to the page...
        view.then(function (todoDom) {
            baseNode.appendChild(todoDom);
        });
    };

    return app;
});