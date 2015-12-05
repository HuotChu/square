# Square[JS]


#### Current version 1.0.1


## Installation
`npm install squarejs --save`


npm will create a node_modules folder (if it does not exist already).  
Inside that folder will be a squarejs folder which contains a `lib` directory.  
It is recommended that you create a lib folder under your own application root directory.  
Copy only the files you need from `node_modules/squarejs/lib` into your lib folder.


For example  
```
V YourAppRoot
    V YourAppDir
        > Your app files
    V lib
        > SquareJS files
```


### Which files you need depends on how you include the framework:
+ minified using `script src="lib/square.min.js"`
  * See `examples/Demo_Buttons` for a sample implementation
+ unminified using `script src="lib/square.js"`
+ using require.js modules, don't use the square.js file
  * For require, use only the files under `lib/modules`
  * See `examples/Demo_Buttons_Require` for a sample implementation
  
  
___


## SquareJS Modules:
+ __util.js__ Provides requisite low-level functionality and shims for the rest of the framework.
+ __box.js__ It's a view in a box, just pass it a 'box config' and you get back a view with all your eventing hooked up. Sweet!
+ __eventHub.js__ Provides native JavaScript Events to data models for data-binding without loops or synthetic events.
+ __notify.js__ Experimental router and pub/sub module still under heavy development.
+ __request.js__ Promise wrapped AJAX requests for when you need to get stuff.
+ __lobro.js__ Persist data to localStorage.
+ __temple.js__ Lightweight templating engine that lets you write valid html templates and automate event management.


### SquareJS contains SquareDB
`./lib/modules/squaredb` or included with square.js and square.min.js

+ __squaredb.js__ Unique and super fast relational database model on the client.  
  Provides SQLish syntax and tons of cool features.
+ __aggregates.js__ Mathematical functions for column data: sum, max, min, avg, count
+ __comparator.js__ Handles comparison logic for WHERE statements
+ __go.js__ Does the heavy lifting for all queries as it takes the QueryObject and executes the query.
+ __Select.js__ Creates instances of the SELECT statement providing FROM and WHERE.


### Online Demo
#### http://squaredb.com/examples/demo1/index.html


## Updates
### 11/29/2015
Squobs was dropped, Square.js now actually contains the framework, and there's a minified Square available which is super tiny and crazy fast.  
There's more API documentation coming over the next few weeks.


#### See changelog for all previous updates.
