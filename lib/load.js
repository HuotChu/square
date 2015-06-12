/**
 * Created by Scott on 5/31/2015.
 */
define(['./temple'], function(temple) {
    var preloader = {};

    preloader.load = function() {
        var templates = [
            // array of templates  -- get and cache
            temple.getTemplate('./app/templates/comment.html', true),
            temple.getTemplate('./app/templates/discussion.html', true),
            temple.getTemplate('./app/templates/hello.html', true),
            temple.getTemplate('./app/templates/post.html', true),
            temple.getTemplate('./app/templates/topic.html', true)
        ];

        Promise.all(templates).then(function() {
            // resources are cached...
            require(['./app/main'], function(app) {
                // launch the app
                app.start();
            });
        }).catch(function(e) {
            // errors land here... do with them what you wish
        });
    };

    return preloader;
});