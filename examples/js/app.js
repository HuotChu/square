define(['js/request', 'js/temple', 'js/notify'], function(request, temple, notify) {
    var app = {};

    // app.startup is called by require.js in the config callback (index.html) to launch the app
    app.startup = function() {
            // reference the BODY node to add new nodes to later
        var baseNode = document.querySelector('body'),
            // get the data file with our products in it -> returns a Promise we'll use later...
            data = request('json/devices.json');

        temple.getTemplate('templates/deviceView.html').then(function(deviceView){
            // temple retrieves a simple template -> returns it as a String in the deviceView argument
            data.then(function(deviceData) {
                // use the data Promise to pass the XHR object into the deviceData argument
                // which ensures the request has completed before executing this code
                var allData = JSON.parse(deviceData['response'])['devices'],
                    // parse the response json data and grab the devices array to assign to allData
                    data,
                    devices,
                    desc,
                    dataMap = {
                        "products": [],
                        "_callbacks": {
                            "publisher": {
                                "event": "click",
                                "function": notify.publisher
                            }
                        }
                    },
                    productTable = {},
                    setText = {
                        descText: '',
                        show: function() {
                            desc.innerHTML = this.descText;
                            desc.className = 'show';
                        },
                        set: function(obj) {
                            var firstClick = !desc.className;

                            this.descText = productTable[obj.id];

                            if (firstClick) {
                                this.show();
                            } else {
                                desc.className = 'hide';
                            }
                        }
                    },
                    i = 0, len = allData.length;

                for (i; i < len; ++i) {
                    data = allData[i];
                    dataMap.products.push({
                        "id": data['id'],
                        "product": data['product']
                    });
                    productTable[data['id']] = data['desc'];
                }

                deviceView = temple.toDom(deviceView, dataMap);
                devices = deviceView.querySelector('#devices');

                notify.subscribe('productSelect', {
                    "callBack": setText.set,
                    "context": setText
                });

                baseNode.appendChild(deviceView);
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