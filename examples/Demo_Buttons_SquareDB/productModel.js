define(['db', 'eventHub', 'request'], function (db, eventHub, request) {
    'use strict';

    return new Promise(function (resolve/*, reject*/) {
        request('devices.json').then(function (deviceData) {
            // use the data Promise to pass the XHR object into the deviceData argument
            // which ensures the request has completed before executing this code

            // parse the response json data and grab the devices array to assign to allData
            var allData = JSON.parse(deviceData['response'])['devices'];

            // create a model (database) named Products
            var model = db.createDB('Products');

            // create a table called devices
            model.createTable('Devices');

            // copy the data array we got from the server in the Table we just made
            // effectively converting a collection of objects into a relational data structure
            model.insertJsonInto('Devices')(allData);

            // connect our model to an eventHub
            eventHub.connect(model);

            // resolve the promise and pass the model to the Promise handler
            resolve(model);
        });
    });
});