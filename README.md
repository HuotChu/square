# Square[JS]
========
Modern Application Development using:
* square.js - Provides requisite low-level functionality and shims for the rest of the framework.
* box.js - It's a view in a box, just pass it a 'box config' and you get back a view with all your eventing hooked up. Sweet!
* eventHub.js - Provides native JavaScript Events to data models for data-binding without loops or synthetic events.
* notify.js - Experimental router and pub/sub module still under heavy development.
* request.js - Promise wrapped AJAX requests for when you need to get stuff.
* squobs.js - Currently broken object collection model. I'll fix it soon, though.
* temple.js - Lightweight templating engine that lets you write valid html templates and automate event management.

SquareJS contains SquareDB ./lib/squaredb/
==================
* squaredb.js - Unique and super fast relational database model on the client. Provides SQLish syntax and tons of cool features.
* aggregates.js - Mathematical functions for column data: sum, max, min, avg, count
* comparator.js - Handles to comparison logic for WHERE statements
* go.js - Does the heavy lifting for all queries as it takes the QueryObject and executes the query.
* Select.js - Creates instances of the SELECT statement providing FROM and WHERE.

## Installation
  npm install square --save

## This framework is in the 'Alpha' stage of development
Current version a0.0.9

## Updates
### 11/15/2015
You've tried MVC, now try SBT! SquareDB + Box + Temple = OMG! Check it out...
Just pushed a complete refactor of temple, the addition of 'box' (I love it!), and a working example showing off squareDB, the eventHub, temple, and request. ./examples/Demo_Buttons_SquareDB
the files under ./product are where the real magic lies.

### 11/13/2015
SquareDB minified added - and it's only 9kb!!! ...and I launched the SquareDB Kickstarter campaign, so that hopefully I get to make SquareJS and SquareDB the full-fledged offerings that I know they can be. https://www.kickstarter.com/projects/blujagu/squaredb

### See changelog for all previous updates.
