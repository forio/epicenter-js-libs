# Epicenter JS Libraries

The Epicenter JS Libraries comprise a set of services (adapters) and managers to help streamline your work with the underlying Epicenter APIs.

If you are comfortable with JavaScript, the epicenter.js library is an easy way to connect your project's model, data, and user interface.

See the full [documentation](https://forio.com/epicenter/docs/public/api_adapters/) for more details.

Questions?  Contact us at support@forio.com.

## Getting started with development

To run locally
```
npm install
bower install

cd tests
npm install

grunt test  or grunt documentation
```
This will create an ```epicenter-edge.js``` file in ```dist/```. When you're happy with your changes do ```grunt production``` and make a pull-request to `master`.

## Development guide
Current code might not be aligned with the guide since is hard to do a library-wide refactor but we should be refactoring current code when is possible.

### Options
Options are passed and merged in most of the "layers":
- Manager constructors and/or methods
- Service constructors and/or methods
- Transport layer (with the `transport` property)

All Managers/Services constructors accept an options object but some methods do not allow override, it should be cleary documented when the method does not allow options override. 

Use the `SessionManager` to automatically get the merged session and library-wide options.

### Services
Use `serviceUtils` for misc service utilities. Like generating the `serviceOptions` using the `SessionManager` and setting the `Authorization` header. Eventually all boilerplate code in the services should be removed in favor of using the `serviceUtils`.

### Tools
New code should:
- Use `require('object-assign')` "ponyfill" and avoid deep object merges as is very slow
- When deep assign needed use: `deep-assign`
- Avoid using jQuery utils methods

### Future
Eventually (maybe v2) we should try to:
- Add library-wide options that we plug into `SessionManager` (all services/managers are using it)
```javascript
F.init({ options: { account: 'acme', version: 'v2' }});
```
- Make the sync call in [configuration-service.js](src/service/configuration-service.js) async as default and add an option to make it sync (so it will be easier to older sims to update):
```javascript
F.init({ config: { syncFetch: true }, options: {...} });
```
- Remove `jQuery` as a global dependency and just require $.ajax (if possible) or replace with another node/browser library (may not be worth the effort $.ajax works fine)
- Use ES6 promises
- Be able to use ES6 imports
```javascript
import F, { RunManager } from 'epicenter-js';
import { DataService } from 'epicenter-js';
import { AuthManager } from 'epicenter-js';
```
- Try not to break documented service or manager methods

&copy; Forio Corporation, 2014-2016.  All rights reserved.


