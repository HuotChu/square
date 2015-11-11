/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define(['./comparator'], function (comparator) {
    'use strict';

    return function (sortObject, operation, targetColumn) {
        // sortObject contains the column to perform the aggregate function on
        var sortArray = sortObject[targetColumn],
            columnNames = [], column,
            len = sortArray.length,
            val, valid;

        for (column in sortObject) {
            if (sortObject.hasOwnProperty(column)) {
                columnNames.push(column);
            }
        }

        val = sortArray.reduce(function (previous, current) {
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
            val = val / len;
        } else if (operation === 'count') {
            val = len * columnNames.length;
            sortObject = {'QUERY_COUNT': [val]};
            return sortObject;
        }

        if (columnNames.length > 1) {
            valid = comparator(sortObject[targetColumn], '===', val);
            columnNames.forEach(function (cName) {
                if (cName !== targetColumn) {
                    column = sortObject[cName];
                    sortObject[cName] = column.filter(function (v, i) {
                        return valid.indexOf(i) !== -1;
                    });
                }
            });
        }

        sortObject[targetColumn] = [val];

        return sortObject;
    };
});