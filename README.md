# JATO
"Jet Assisted Take Off" for Modern Application Development

## What is JATO?
JATO (Jet Assisted Take Off) is an application framework written in JavaScript that gets your project off the ground with lightning speed. The first thing that should excite you about the JATO framework is the tiny footprint.  JATO unminified is smaller than any other comparable minified framework!  Plus, JATO provides a true MVC architecture which uses eventing rather than digest loops, HTML that validates, AJAX calls returns Promises, and the model supports both relational and non-relational approaches to storing and retrieving data.

## What about performance?
To compare a framework with a jet implies awesome power and speed.  JATO lives up to it's name by offering compact, powerful functions and using native JavaScript methodology "under the hood" as much as possible. Most frameworks waste operations on extraneous function calls, looping mechanisms, and costly DOM lookups.  JATO gets the job done using optimized code structures, multiple caching mechanisms, and best of all... you should never need to do a DOM lookup in JATO.  Rather, JATO caches DOM nodes you care about as properties of the view object which makes retrieval fast and easy.  Speaking of fast and easy, the view knows how to tear itself down and it cleans up all associated event handlers as it implodes.  This brings up another good point which is that JATO is not only fast in terms of applications speed, it also results in rapid architecture and development.

## This framework is in Alpha
Look for daily refinements :)
Contribution instructions, license, and other stuff will be added... eventually.

## Updates
### 10/18/2015
The application is in a huge state of flux right now as I take the best of model.js and jSQL.js to create a hybrid
relational/noSQL solution. For now I'll call it SQLish (lib/SQLish.js)
Oh... check out the new eventing mechanism as well, lib/eventHub.js - it's awesome, I can't wait to put it into action!
### 10/01/2015
Tons of bug fixes and rewrites today. model's domDataNodes is still buggy and needs better structure.
### 9/29/2015
Complete rewrite of the model and data-binding via dataSpies... more on that soon.
### 8/14/2015
Added a Model service for a lightweight model (when jSQL is overkill)
The sample app in the examples directory showcases the new model
### 6/19/2015
There is now an examples directory where I can showcase the power and sensibility of JATO
### 6/15/2015
Temple now supports repeating elements AND Temple can now attach event handlers!