/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define([], function () {
    'use strict';

    var aggregateFunction = function (dataArray, operation) {
        // sortObject contains the columns to perform the aggregate function on
        var columnName, sortArray, sortArrayLength,
            sortObject = createSortObject(dataArray);

        for (columnName in sortObject) {
            if (sortObject.hasOwnProperty(columnName)) {
                sortArray = sortObject[columnName];
                sortArrayLength = sortArray.length;
                sortArray = sortArray.reduce(function (previous, current) {
                    var rtn;

                    if (operation === 'min') {
                        rtn = previous < current ? previous : current;
                    } else if (operation === 'max') {
                        rtn = previous > current ? previous : current;
                    } else if (operation === 'sum' || operation === 'avg') {
                        rtn = previous + current;
                    }

                    return rtn;
                });
                if (operation === 'avg') {
                    sortArray = sortArray / sortArrayLength;
                } else if (operation === 'count') {
                    sortArray = sortArrayLength;
                }
                sortObject[columnName] = sortArray;
            }
        }

        return sortObject;
    };
});