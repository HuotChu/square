define(['db', 'eventHub', 'request', 'lobro'], function (db, eventHub, request, lobro) {
    'use strict';

    return new Promise(function (resolve) {
        // create a model (database) named Products
        var model = db.createDB('Products');
        // enable model events
        model = eventHub.connect(model);
        // enable localStorage
        model = lobro.connect(model);
        // check if we already have the data
        if (model.isCurrent('Products', 1)) {
            // load localStorage data into the model
            model.sync('Products');
            // enable events so lobro will auto-update localStorage when data changes
            model.enableEvents();
            // resolve and pass the model to the handler
            resolve(model);
        } else {
            request('devices.json').then(function (deviceData) {
                // get the XHR response from the deviceData argument
                // parse response json and grab the devices array
                var allData = JSON.parse(deviceData['response'])['devices'];
                // create a table called devices
                model.createTable('Devices');
                // copy the data array from the server into the Table
                // converts a collection of objects to relational structure
                model.insertJsonInto('Devices')(allData);
                if (model.enableEvents) {
                    // ensure no old localStorage model exists
                    model.clearLocal();
                    // copy model to localStorage with version 1
                    model.persist(model, 1);
                    // tell lobro to update localStorage when the model data changes
                    model.enableEvents();
                }
                // resolve and pass the model to the handler
                resolve(model);
            });
        }
    });
});
