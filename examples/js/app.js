define(['js/request', 'js/temple', 'js/notify', 'js/mods/product/productModel'], function(request, temple, notify, productModel) {
    var app = {};

    // app.startup is called by require.js in the config callback (index.html) to launch the app
    app.startup = function() {
            // reference the BODY node to add new nodes to later
        var baseNode = document.querySelector('body');

        // add the device view to the page...
        temple.getTemplate('templates/deviceView.html').then(function(deviceView){
            // temple retrieves a simple template -> returns it as a String in the deviceView argument
            productModel.then(function(model) {
                var setText = {
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
                }, view, devices, desc;

                view = temple.toDom(deviceView, model);
                devices = view.querySelector('#devices');

                notify.subscribe('productSelect', {
                    "callBack": setText.set,
                    "context": setText
                });

                baseNode.appendChild(view);
                desc = baseNode.querySelector('#description');
                desc.addEventListener('transitionend', function() {
                    if (desc.className == 'hide') {
                        setText.show();
                    }
                }, false);
            });
        });
    };

    return app;
});