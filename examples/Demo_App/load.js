/**
 * Created by Scott on 5/31/2015.
 */
define(['../../lib/temple', '../../lib/notify',  'hello/hello', 'main'], function (temple, notify, hello, main) {
    var preloader = {};

    preloader.load = function () {
        var templates = [
            // array of templates  -- get and cache
            temple.getTemplate('./hello/hello.html', true),
            temple.getTemplate('./templates/comment.html', true),
            temple.getTemplate('./templates/discussion.html', true),
            temple.getTemplate('./templates/post.html', true),
            temple.getTemplate('./templates/topic.html', true)
        ];

        // set routes to auto-publish when the uri hash changes
        notify.setRoute('#hello');

        Promise.all(templates).then(function () {
            // resources are cached...
            //require(['main'], function (app) {
                // launch the app
                main.start();
            //});
        }).catch(function (e) {
            // errors land here... do with them what you wish
        });
    };

    return preloader;
});