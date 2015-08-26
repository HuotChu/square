/**
 * Created by Scott on 5/31/2015.
 */
define(['./../lib/temple', '../lib/notify',  '../app/hello/hello'], function (temple, notify, hello) {
    var preloader = {};

    preloader.load = function () {
        var templates = [
            // array of templates  -- get and cache
            temple.getTemplate('./app/hello/hello.html', true),
            temple.getTemplate('./app/templates/comment.html', true),
            temple.getTemplate('./app/templates/discussion.html', true),
            temple.getTemplate('./app/templates/post.html', true),
            temple.getTemplate('./app/templates/topic.html', true)
        ];

        // set routes to auto-publish when the uri hash changes
        notify.setRoute('#hello');

        Promise.all(templates).then(function () {
            // resources are cached...
            require(['./app/main'], function (app) {
                // launch the app
                app.start();
            });
        }).catch(function (e) {
            // errors land here... do with them what you wish
        });
    };

    return preloader;
});