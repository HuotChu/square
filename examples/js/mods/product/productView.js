/**
 * Created by Scott on 8/17/2015.
 */
define(['js/temple', 'js/notify', 'js/mods/product/productModel'], function (temple, notify, productModel) {
    return new Promise(function (resolve, reject) {
        temple.getTemplate('js/mods/product/product.html').then(function (deviceView) {
            // temple retrieves a simple template -> returns it as a String in the deviceView argument
            productModel.then(function (model) {
                var desc,
                    setText = {
                    descText: '',
                    show: function () {
                        desc.innerHTML = this.descText;
                        desc.className = 'show';
                    },
                    set: function (obj) {
                        var firstClick = !desc.className;

                        this.descText = model.select('products', function (o) {
                            return o.id === obj.id ? o : false;
                        }).$get('desc');

                        if (firstClick) {
                            this.show();
                        } else {
                            desc.className = 'hide';
                        }
                    }
                }, view, devices;

                view = temple.toDom(deviceView, model);
                devices = view.querySelector('#devices');
                desc = view.querySelector('#description');

                notify.subscribe('productSelect', {
                    "callBack": setText.set,
                    "context": setText
                });

                desc.addEventListener('transitionend', function() {
                    if (desc.className == 'hide') {
                        setText.show();
                    }
                }, false);

                resolve(view);
            });
        });
    });
});