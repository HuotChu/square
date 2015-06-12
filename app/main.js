/**
 * Created by Scott on 5/29/2015.
 */
define(['../lib/temple', '../lib/notify', '../lib/jSQL'], function(temple, notify, jSQL) {
    var app = {
        baseNode: document.getElementById('jato') || document.querySelector('body')
    };

    app.start = function() {
        // Eventually this will be a sample application and tests will be in the tests folder...
        // but for now, testing here allows for rapid development :)
        var dataMap = {
                helloID: 'hello',
                helloTag: 'h1',
                helloText: 'Hello, JATO. You are cleared for takeoff.',
                helloImage: 'app/style/jet.gif'
            };

        temple.getTemplate('./app/templates/hello.html', true).then(function(htmlStr) {
            app.baseNode.appendChild(temple.toDom(htmlStr, dataMap));
        });

        jSQL.create.db('testDB').table('Customers')([
            ['CustomerID', {
                'primary': true,
                'auto': true,
                'domain': /\d+/i,
                'data': [
                    1, 2, 3, 4, 5
                ]
            }],
            ['CustomerName', {
                'domain': /[\w\s]+/gi,
                'data': [
                    'Alfreds Futterkiste',
                    'Ana Trujillo Emparedados',
                    'Antonio Moreno Taquería',
                    'Around the Horn',
                    'Berglunds snabbköp'
                ]
            }],
            ['ContactName', {
                'domain': /[\w\s]+/gi,
                'data': [
                    'Maria Anders',
                    'Ana Trujillo',
                    'Antonio Moreno',
                    'Thomas Hardy',
                    'Christina Berglund'
                ]
            }],
            ['Address', {
                'domain': /.+]/gi,
                'data': [
                    'Obere Str. 57',
                    'Avda. de la Constitución 2222',
                    'Mataderos 2312',
                    '120 Hanover Sq.',
                    'Berguvsvägen 8'
                ]
            }],
            ['City', {
                'domain': /\d+/i,
                'data': [
                    'Berlin',
                    'Mexico City',
                    'Mexico City',
                    'London',
                    'Hamburg'
                ]
            }],
            ['PostalCode', {
                'domain': /\d+/i,
                'data': [
                    'S-542 35',
                    '05021',
                    '05023',
                    'WA1 1DP',
                    'S-958 22'
                ]
            }],
            ['Country', {
                'domain': /\d+/i,
                'data': [
                    'Germany',
                    'Mexico',
                    'Mexico',
                    'United Kingdom',
                    'Germany'
                ]
            }]
        ]);

        var query;

        query = jSQL.select('testDB', {
            'select': 'City',
            'from':   'Customers'
        });

        console.log('SELECT City FROM Customers: ', query);

        query = jSQL.select('testDB', {
            'select': 'City',
            'from':   'Customers',
            'distinct': true
        });

        console.log('SELECT DISTINCT City FROM Customers: ', query);

        query = jSQL.select('testDB', {
            'select': 'City',
            'from':   'Customers',
            'distinct': true,
            'where': [
                {
                    'column': 'Country',
                    'operator': '==',
                    'value': 'Germany'
                }
            ]
        });

        console.log('SELECT DISTINCT City FROM Customers WHERE Country="GERMANY": ', query);

        query = jSQL.select('testDB', {
            'select': 'PostalCode',
            'from':   'Customers',
            'where': [
                {
                    'column': 'Country',
                    'operator': '==',
                    'value': 'Germany'
                }
            ]
        });

        console.log('SELECT PostalCode FROM Customers WHERE Country="GERMANY": ', query);
        /*
         //...working on it...
        query = jSQL.select('testDB', {
            'select': 'PostalCode',
            'from':   'Customers',
            'where': [
                {
                    'column': 'Country',
                    'operator': '==',
                    'value': 'Germany',
                    // AND
                    'and': {
                        'column': 'City',
                        'operator': '==',
                        'value': 'Berlin'
                    }
                },
                // OR
                {
                    'column': 'City',
                    'operator': '==',
                    'value': 'London'
                }
            ]
        });

        console.log('SELECT PostalCode FROM Customers WHERE (Country="Germany" AND City="Berlin") OR City = "London": ', query);
         */
        query = jSQL.select('testDB', {
            'select': '*',
            'from':   'Customers'
        });

        console.log('SELECT * FROM Customers: ', query);

        query = jSQL.select('testDB', {
            'select': 'City',
            'from':   'Customers',
            'where': [
                {
                    'column': 'City',
                    'operator': '==',
                    'value': 'Berlin'
                }
            ]
        });

        console.log('SELECT City FROM Customers WHERE City="Berlin": ', query);

        query = jSQL.select('testDB', {
            'select': 'CustomerID',
            'from':   'Customers',
            'where': [
                {
                    'column': 'CustomerID',
                    'operator': '==',
                    'value': 3
                }
            ]
        });

        console.log('SELECT CustomerID FROM Customers WHERE CustomerID=3: ', query);

        query = jSQL.select('testDB', {
            'select': 'CustomerID, City',
            'from':   'Customers',
            'where': [
                {
                    'column': 'CustomerID',
                    'operator': '==',
                    'value': 4
                }
            ]
        });

        console.log('SELECT CustomerID, City FROM Customers WHERE CustomerID=4: ', query);

    };

    return app;
});