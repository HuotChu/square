/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['box', 'productModel'], function(Box, productModel) {
    'use strict';

    productModel.then(function (model) {
        var boxConfig = {
            model: model,

            data: {
                devices: model.select('product, id').from('Devices').go()
            },

            target: document.querySelector('#button-demo'),

            template: 'product.html',

            domEvents: [
                {
                    event: 'click',
                    id: 'productButton_',
                    callback: function (id, domNode, box) {
                        box.index['desc'].className = 'hidden';
                        model.select('desc')
                                  .from('Devices')
                                  .where('id', '===', id)
                                  .go();
                    }
                }
            ],

            modelEvents: [
                {
                    event: 'Products.Devices.desc.read',
                    id: 'desc',
                    callback: function (event, descriptionNode) {
                        setTimeout(function () {
                            descriptionNode.innerHTML = event.detail.value;
                            descriptionNode.className = 'show';
                        }, 500);
                    }
                }
            ]
        };

        new Box(boxConfig).build();
    });
});