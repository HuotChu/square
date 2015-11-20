/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['box', 'productModel'], function(Box, productModel) {
    'use strict';

    productModel.then(function (model) {
        window.db = model;

        var getDescription = {
            event: 'click',
            id: 'productButton_',
            callback: function (id, domNode, box) {
                box.index['desc'].className = 'hidden';
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
                getDescription
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
                            descriptionElement.innerHTML = event.detail.value;
                            descriptionElement.className = 'show';
                        }, 500);
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
});