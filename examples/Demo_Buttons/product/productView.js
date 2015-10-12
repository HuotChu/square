/**
 * Created by Scott on 8/17/2015.
 */
define(['temple', 'notify', 'product/productModel'], function (temple, notify, productModel) {
    return new Promise(function (resolve, reject) {
        temple.getTemplate('product/product.html').then(function (deviceView) {
            // temple retrieves a simple template -> returns it as a String in the deviceView argument
            productModel.then(function (model) {
                var desc,
                    products = model.getNodeFromPath('devices'),
                    setText = {
                        descText: '',
                        show: function () {
                            desc.innerHTML = this.descText;
                            desc.className = 'show';
                    },
                    set: function (obj) {
                        var firstClick = !desc.className,
                            query = products.query('isEqual', ['id', obj.id]).found;

                        this.descText = query.get('desc');

                        if (firstClick) {
                            this.show();
                        } else {
                            desc.className = 'hide';
                        }
                    }
                },
                view = temple.toDom(deviceView, model._data);

                desc = view.querySelector('#description');

                notify.subscribe('productSelect', {
                    "callBack": setText.set,
                    "context": setText
                });

                desc.addEventListener('transitionend', function () {
                    if (desc.className == 'hide') {
                        setText.show();
                    }
                }, false);

                resolve(view);
            });
        });
    });
});