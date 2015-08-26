/**
 * Created by Scott on 8/21/2015.
 */
define(['../../lib/temple', '../../lib/notify'], function(temple, notify) {
    'use strict';
    var helloPromise = new Promise(function (resolve, reject) {
        temple.getTemplate('app/hello/hello.html', true).then(function (helloTemplate) {
            var hello = temple.toDom(helloTemplate, {
                helloID: 'hello',
                helloTag: 'h1',
                helloText: 'Hello, JATO. You are cleared for takeoff!',
                helloImage: 'app/style/jet.gif'
            });

            resolve(hello);
        }).catch(function (reason) {
            reject(reason);
        });
    });

    notify.subscribe('#hello', function () {
        helloPromise.then(function (helloDom) {
            window.document.querySelector('#hello-dom').appendChild(helloDom);
        });
    });

    return helloPromise;
});