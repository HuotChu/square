define(['db', 'eventHub', 'request'], function (db, eventHub, request) {
    'use strict';

    return new Promise(function (resolve/*, reject*/) {
        request('devices.json').then(function (deviceData) {
            // get the XHR object from the deviceData argument
            // ensures the request completed before executing this code
            // parse response json and grab the devices array
            var allData = JSON.parse(deviceData['response'])['devices'];

            // create a model (database) named Products
            var model = db.createDB('Products');

            // create a table called devices
            model.createTable('Devices');

            // copy the data array from the server into the Table
            // converts a collection of objects to relational structure
            model.insertJsonInto('Devices')(allData);

            // connect our model to an eventHub
            eventHub.connect(model);

            // resolve and pass the model to the handler
            resolve(model);
        });
    });
});