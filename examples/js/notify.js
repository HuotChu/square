/**
 * Created by Scott on 4/10/2015.
 */
define(function() {
        // comments show sample data structure
    var notifications = {
        "topics": {
            //"topicName1": [
            //    {
            //        "callBack": function() {console.log("testing 1")},
            //        "context": {},
            //        "id": 1
            //    },
            //    {
            //        "callBack": function() {console.log("testing 2")},
            //        "context": {},
            //        "id": 2
            //    }
            //]
        },
        "lastIdMap": {
            //"topicName1": 2
        }
    };

    var findById = function(arr, id) {
        // pass in an array of objects and an id
        // returns the object with the correct id
        var len = arr.length,
            half = function() {
                return len > 1 ? Math.floor(len / 2) - 1 : 0
            },
            indexMod = 0,
            foundIndex = -1;

            // no need to search the whole array
            // check the middle to see if our id is in the first half or the second
            // do this recursively until we find our object
        var reduceArr = function() {
            var n = half(),
                i = n ? n + 1 : 1,
                centerId = arr[n].id;

            if (centerId === id) {
                foundIndex = n;
            } else if (centerId > id) {
                arr.splice(n, i);
            } else {
                arr.splice(0, i);
                indexMod += i;
            }
        };

        while (len > 0 && foundIndex < 0) {
            reduceArr();
            len = arr.length;
        }

        if (foundIndex >= 0) {
            foundIndex += indexMod;
        }

        return foundIndex;
    };

    var subscribe = function(topic, callBackObj) {
        var topics = notifications.topics,
            lastIdMap = notifications.lastIdMap,
            id;

        if (!topics.hasOwnProperty(topic)) {
            topics[topic] = [];
        }

        if (!lastIdMap.hasOwnProperty(topic)) {
            lastIdMap[topic] = 0;
        }

        id = ++lastIdMap[topic];

        topics[topic].push({
            "callBack": callBackObj.callBack,
            "context": callBackObj.context,
            "id": id
        });

        return id;
    };

    var unsubscribe = function(topic, id) {
        var topics = notifications.topics,
            topicArray;

        if (topics.hasOwnProperty(topic)) {
            topicArray = notifications.topics[topic];
            topicArray.splice(findById(topicArray, id));
            return true;
        }

        return false;
    };

    var publish = function(topic) {
        var topics = notifications.topics,
            uri = topic.split('?'),
            topicName = uri[0],
            args = uri.length === 2 ? uri[1] : null,
            obj = {},
            tmp = [],
            subscribers = topics[topicName],
            subscriber,
            prop,
            i = 0,
            len;

        if (args) {
            // convert string to object
            //  a=1&b=2
            // {a:1,b:2}
            args = args.split('&');
            len = args.length;
            for (i; i < len; ++i) {
                tmp = args[i].split('=');
                obj[ tmp[0] ] = tmp[1];
            }
            args = obj;
        }

        for (prop in subscribers) {
            subscriber = subscribers[prop];
            subscriber.callBack.call(subscriber.context, args);
        }
    };

    var publisher = function(event) {
        var args = event.target.hash.slice(1);

        publish(args);
    };

    return {
        "subscribe": subscribe,
        "unsubscribe": unsubscribe,
        "publish": publish,
        "publisher": publisher
    }
});