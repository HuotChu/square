/**
 * Created by Scott on 8/21/2015.
 */
define(['../../../lib/temple', '../../../lib/notify'], function(temple, notify) {
    'use strict';
    var helloPromise = new Promise(function (resolve, reject) {
        temple.getTemplate('hello/hello.html', true).then(function (helloTemplate) {
            var hello = temple.toDom(helloTemplate, {
                helloID: 'hello',
                helloTag: 'h1',
                helloText: 'Hello, JATO. You are cleared for takeoff!',
                helloImage: 'style/jet.gif'
            });

            resolve(hello);
        }).catch(function (reason) {
            reject(reason);
        });
    });

    // tell notify.js to auto-publish this topic when the uri hash changes to it
    notify.setRoute('#hello');

    notify.subscribe('#hello', function () {
        helloPromise.then(function (helloDom) {
            window.document.querySelector('#hello-dom').appendChild(helloDom);
        });
    });

    return helloPromise;
});