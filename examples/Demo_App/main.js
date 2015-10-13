/**
 * Created by Scott on 5/29/2015.
 */
define(['../../lib/jSQL', '../../lib/SQLish'], function(jSQL, SQLish) {
    var app = {
        baseNode: document.getElementById('jato') || document.querySelector('body')
    };

    app.start = function() {
        // Eventually this will be a sample application and tests will be in the tests folder...
        // but for now, testing here allows for rapid development :)

        // make sure auto-publish knows the current URI
        // solves initial load of url, ie. from a bookmark - site.com/index.html#info
        // otherwise, initial url hash is not evaluated
        window.dispatchEvent(new Event('hashchange'));

        var dataObj = new DataObject(),
            model = SQLish.model;

        model.addListener('truth', function (e) {
            // this === currentTarget
            this.log('truth was heard with args:', arguments);
            this.log('The truth about me is:', e.detail.value);
        }, console); // console was passed as the currentTarget

        model.addListener('truth.about', function () {
            this.log('truth.about was heard with args:', arguments);
        }, console);

        model.addListener('truth.about.me', function () {
            this.log('truth.about.me was heard with args:', arguments);
        }, console);

        dataObj.set('Scott Loves Jaime', 'truth.about.me');

        console.log('---------------------------------------------------------------');

        // TODO: move to tests!!!
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
                'domain': /[\w]+/gi,
                'data': [
                    'Alfreds Futterkiste',
                    'Ana Trujillo Emparedados',
                    'Antonio Moreno Taqueria',
                    'Around the Horn',
                    'Berglunds snabbkop'
                ]
            }],
            ['ContactName', {
                'domain': /[\w]+/gi,
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
                    'Avda. de la Constitucion 2222',
                    'Mataderos 2312',
                    '120 Hanover Sq.',
                    'Berguvsvagen 8'
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

        console.log('Running jSQL Tests...');

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