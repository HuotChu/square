(function () {
    "use strict";
    var Box = square.Box,
        eventHub = square.eventHub,
        lobro = square.lobro,
        request = square.request,
        db = square.db;

    var productModel = new Promise(function (resolve) {
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

    (function () {
        productModel.then(function (model) {
            var getDescription = {
                event: 'click',
                id: '_productButton_',
                callback: function (id, domNode, box) {
                    var pushed = domNode.parentNode.parentNode.querySelector('.pushed');

                    if (pushed) {
                        pushed.className = 'button';
                    }
                    box.index['desc'].className = 'hide';
                    domNode.className = 'button pushed';
                    model.select('desc')
                        .from('Devices')
                        .where('id', '===', id)
                        .go();
                }
            };

            var boxConfig = {
                model: model,

                data: {
                    deviceCount: model['Devices'].count(),
                    devices: model.select('product, id').from('Devices').go()
                },

                target: document.querySelector('#button-demo'),

                template: 'product.html',

                domEvents: [
                    getDescription,
                    {
                        event: 'click',
                        id: 'add-new',
                        callback: function (domNode, box) {
                            var pName = box.index['name-input'],
                                pDesc = box.index['desc-input'],
                                pId = model.createUnique();

                            if (pName && pDesc) {
                                model.insertInto('Devices')('product, desc, id').values(pName.value, pDesc.value, pId);
                                pName.value = '';
                                pDesc.value = '';
                            }
                        }
                    }
                ],

                modelEvents: [
                    {
                        event: 'Products.Devices.count.read',
                        id: 'counter',
                        callback: function (event, counterElement) {
                            counterElement.innerHTML = event.detail.value;
                        }
                    },
                    {
                        event: 'Products.Devices.desc.read',
                        id: 'desc',
                        callback: function (event, descriptionElement) {
                            setTimeout(function () {
                                descriptionElement.className = '';
                                descriptionElement.innerHTML = event.detail.value;
                            }, 800);
                        }
                    },
                    {
                        event: 'Products.Devices.product.create',
                        id: 'buttons',
                        callback: function (event, buttonsContainer) {
                            productBox.then(function (box) {
                                box.domEvents.push(getDescription);
                                box.target = buttonsContainer;
                                box.template = box.templates['device-button'];
                                box.data = model.select('product, id').from('Devices').where('product', '===', event.detail.value).go()[0];
                                box.build({}, box);
                            });
                        }
                    }
                ]
            };

            var productBox = new Box(boxConfig).view;
        });
    }());

}());