define(['product/productBox'], function (productView) {
    // todo: remove app.js
    return {
        startup: function () {
            // reference the button-demo node to add new nodes to later
            var baseNode = document.querySelector('#button-demo');

            // add the product module to the page...
            productView.then(function (view) {
                baseNode.appendChild(view);
            });
        }
    };
});