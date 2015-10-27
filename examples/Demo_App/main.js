/**
 * Created by Scott on 5/29/2015.
 */
define([], function() {
    var app = {
        baseNode: document.getElementById('jato') || document.querySelector('body')
    };

    app.start = function() {
        // make sure auto-publish knows the current URI
        // solves initial load of url, ie. from a bookmark - site.com/index.html#info
        // otherwise, initial url hash is not evaluated
        window.dispatchEvent(new Event('hashchange'));
    };

    return app;
});