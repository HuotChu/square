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

        var model = SQLish('truth'), // Create model named 'truth'
            collection,
            dataObj = new DataObject(),
            eventName;

        model.addListener('truth', function (e) { // listen to the model for changes
            this.log('truth was heard with args:', e);
        }, console);

        collection = model.add('about');  // add a collection to the model;

        model.addListener('truth.about', function (e) { // listen to the collection for changes
            this.log('truth.about was heard with args:', e);
        }, console);

        eventName = collection.add(dataObj);  // event name to listen for changes to this DataObject

        model.addListener(eventName, function (e) {  // listen to DataObject for changes
            // this === currentTarget
            this.log(eventName + ' was heard with args:', e);
            //this.log('The truth about me is:', e.detail.value);
        }, console); // console was passed as the currentTarget

        model.addListener(eventName + '.me', function (e) { // listen to the 'me' property of the DataObject
            this.log(eventName + '.me was heard with args:', e);
        }, console);

        dataObj.set('Scott Loves Jaime', 'me');

        model.addListener(eventName + '.dataChange', function (e) { // listen to the generic 'dataChange' property of the DataObject
            this.log(eventName + '.dataChange was heard with args:', e);
        }, console);

        dataObj.set('Scott Loves Jaime!');

        // todo: how do I kill off a handler when the element bound to it is destroyed?
        //       especially since the closure on the element keeps it alive (zombie element)

        // todo: drop should get the index from passed in dataObj
        // collection.drop(0);
        // model.dispatch(eventName + '.dataChange', {});

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