/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['box', 'productModel'], function(Box, productModel) {
    'use strict';

    return new Promise(function (resolve) {
        productModel.then(function (model) {
            var boxConfig = {
                model: model,

                data: {
                    devices: model.select('*').from('Devices').go()
                },

                target: document.querySelector('#button-demo'),

                template: 'product.html',

                domEvents: [
                    {
                        event: 'click',
                        id: 'showProduct_',
                        callback: function (id, domNode, box) {
                            box.index['desc'].className = 'hidden';
                            model.select('desc').from('Devices').where('id', '===', id).go();
                        }
                    }
                ],

                modelEvents: [
                    {
                        event: 'Products.Devices.desc.read',
                        id: 'desc',
                        callback: function (event, descriptionNode) {
                            setTimeout(function () {
                                descriptionNode.innerHTML = event.detail.value[0]['desc'];
                                descriptionNode.className = 'show';
                            }, 500);
                        }
                    }
                ]
            };

            var box = new Box(boxConfig);

            box.build().then(function (html) {
                resolve(html);
            });
        });
    });
});