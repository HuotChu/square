/**
 * Created by Scott Bishop on 4/07/2015.
 *
 * Accepts a URI such as 'json/topic_01' which will request ../json/topic_01.json
 * Optionally pass arguments on the URI 'json/topic_01?author_id=1'
 * Returns a Promise passing the entire xhr object to a function in the 'then' block
 * Arguments passed on the URI can be retrieved via the uriArgs property of the xhr object
 *
 */
define(function() {
    return function(uri, post) {
        uri = decodeURI(uri);
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest(),
                separatorIndex = uri.indexOf('?'),
                sliceIndex = separatorIndex < 0 ? uri.length : separatorIndex,
                resource = uri.slice(0, sliceIndex),
                args = uri.slice(sliceIndex + 1).split('&');

            xhr.open(!post ? 'GET' : 'POST', resource);

            if (post) {
                xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            }

            xhr.onload = function() {
                var i = 0, len, prop, val, temp;

                if (xhr.response) {
                    if (args.length) {
                        // if arguments were passed on the URI, attach them to the xhr object
                        xhr.uriArgs = {};
                        len = args.length;
                        for (i; i < len; ++i) {
                            temp = args[i].split('=');
                            prop = temp[0];
                            val = temp[1];
                            xhr.uriArgs[prop] = val;
                        }
                    }
                    // promise completed successfully
                    resolve(xhr);
                } else {
                    // reject promise - request error
                    reject(Error(xhr.statusText));
                }
            };

            xhr.onerror = function() {
                // reject promise - xhr epic fail
                reject(Error("Network Error"));
            };

            xhr.send(!post ? null : args);
        });
    };
});