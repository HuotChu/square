define(['js/model', 'js/notify', 'js/request'], function (model, notify, request) {
    'use strict';
    return new Promise(function (resolve, reject) {
        request('json/devices.json').then(function(deviceData) {
            // use the data Promise to pass the XHR object into the deviceData argument
            // which ensures the request has completed before executing this code

            // parse the response json data and grab the devices array to assign to allData
            var allData = JSON.parse(deviceData['response'])['devices'],
                productModel = model.create('product').insert('products', allData);

            productModel.register('publisher', 'click', notify.publisher);
            resolve(model.getModel('product'));
        })
    });
});