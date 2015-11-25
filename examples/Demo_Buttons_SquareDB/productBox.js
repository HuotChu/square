/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['box', 'productModel'], function(Box, productModel) {
    'use strict';

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
                            pId = db.createUnique();

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
});