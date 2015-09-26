define(['model', 'notify', 'request'], function (model, notify, request) {
    'use strict';
    return new Promise(function (resolve, reject) {
        request('json/devices.json').then(function (deviceData) {
            // use the data Promise to pass the XHR object into the deviceData argument
            // which ensures the request has completed before executing this code

            // parse the response json data and grab the devices array to assign to allData
            var allData = JSON.parse(deviceData['response'])['devices'];

            // create a model named productModel
            var productModel = model.create('productModel');

            // create a named data array and insert into the model
            var dataArray = productModel.newDataArray('devices', '');

            // copy the data array we got from the server in the dataArray we just made
            // this will convert all the data into dataObjects and add query to the array
            dataArray.cloneArray(allData);

            // TEST
            //var productObj = dataArray.query('isEqual', ['id','s4']);
            //console.log("Should be 'Sony 4': ", productObj.get('product'));

            // register the publisher event handler on the model so temple.js can attach it to templates
            productModel.register('publisher', 'click', notify.publisher);

            // resolve the promise and pass the model to the Promise handler
            resolve(productModel);
        })
    });
});