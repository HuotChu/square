/**
 * Copyright (c) 2015 Scott Bishop
 * BluJagu, LLC - www.blujagu.com
 * MIT License (MIT) - This header must remain intact.
 **/
define([], function () {
    'use strict';

    return function (column, operator, control) {
        var firstPeriod = control.indexOf('.'),
            secondPeriod = control.lastIndexOf('.'),
            startsWith = firstPeriod !== 0,
            endsWith = secondPeriod !== control.length - 1,
            i = 0, len = column.length, matches = [],
            found, row, inMatches, regX;

        if (operator === 'like' || operator === 'not like') {
            if (startsWith) {
                control = '^' + control;
            }
            if (endsWith) {
                control += '$';
            }
        }

        for (i; i < len; ++i) {
            row = column[i];
            if (row) {
                switch (operator) {
                    case '==':
                        found = row == control;
                        break;
                    case '===':
                        found = row === control;
                        break;
                    case '>':
                        found = row > control;
                        break;
                    case '<':
                        found = row < control;
                        break;
                    case '>=':
                        found = row >= control;
                        break;
                    case '<=':
                        found = row <= control;
                        break;
                    case '!=':
                        found = row != control;
                        break;
                    case '!==':
                        found = row !== control;
                        break;
                    case 'like':
                        regX = new RegExp(control, 'i');
                        found = regX.test(row);
                        break;
                    case 'not like':
                        regX = new RegExp(control, 'i');
                        found = !regX.test(row);
                        break;
                    default:
                        found = false;
                }

                inMatches = matches.indexOf(i) > -1; // if already in matches, don't add it again...
                if (found && !inMatches) {
                    matches.push(i);
                }
            }
        }

        return matches;
    };
});