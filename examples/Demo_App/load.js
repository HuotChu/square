/**
 * Created by Scott on 5/31/2015.
 */
define(['../../lib/temple', '../../lib/notify',  'hello/hello', 'main'], function (temple, notify, hello, main) {
    var preloader = {};

    preloader.load = function () {
        var templates = [
            // array of templates  -- get and cache
            // TODO: Move this to discussion forum Demo
            temple.getTemplate('./hello/hello.html', true),
            temple.getTemplate('./templates/comment.html', true),
            temple.getTemplate('./templates/discussion.html', true),
            temple.getTemplate('./templates/post.html', true),
            temple.getTemplate('./templates/topic.html', true)
        ];

        // hello.js (view) loaded and is listening to the #hello topic, so no need to 'start' it manually

        Promise.all(templates).then(function () {
            // resources are cached...
                // launch the app (this does almost nothing in this example except run tests)
                main.start();
            //});
        }).catch(function (e) {
            // errors land here... do with them what you wish
        });
    };

    return preloader;
});