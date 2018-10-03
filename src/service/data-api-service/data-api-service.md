## Data API Service

The Data API Service allows you to create, access, and manipulate data related to any of your projects. Data are organized in collections. Each collection contains a document; each element of this top-level document is a JSON object. (See additional information on the underlying [Data API](../../../rest_apis/data_api/).)

All API calls take in an "options" object as the last parameter. The options can be used to extend/override the Data API Service defaults. In particular, there are three required parameters when you instantiate the Data Service:
* `account`: Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
* `project`: Epicenter project id.
* `root`: The the name of the collection. If you have multiple collections within each of your projects, you can also pass the collection name as an option for each call.

 ```js
var ds = new F.service.Data({
    account: 'acme-simulations',
    project: 'supply-chain-game',
    root: 'survey-responses',
    scope: F.service.Data.SCOPES.USER,
});
ds.saveAs('user1',
    { 'question1': 2, 'question2': 10,
    'question3': false, 'question4': 'sometimes' } );
ds.saveAs('user2',
    { 'question1': 3, 'question2': 8,
    'question3': true, 'question4': 'always' } );
ds.query('',{ 'question2': { '$gt': 9} });
``` 

Note that in addition to the `account`, `project`, and `root`, the Data Service parameters optionally include a `server` object, whose `host` field contains the URI of the Forio server. This is automatically set, but you can pass it explicitly if desired. It is most commonly used for clarity when you are [hosting an Epicenter project on your own server](../../../how_to/self_hosting/).

### Notes on scoping:

The `scope` parameter determines who has read-write access to this data collection. Available scopes are:

| Scope | Readable By | Writable By
| ------------- | ------------- | ------------- |
| GROUP | Facilitators & Users in that group | Faciliators in that group|
| USER | Faciliator in that group. User who created the collection | Faciliator in that group. User who created the collection |
| FACILITATOR | Faciliators in that group | Faciliators in that group |
| PROJECT (default, for legacy reasons) | Any user in the project | Any user in the project |
| CUSTOM (to opt out of naming conventions) | customize with Epicenter-api-proxy | customize with Epicenter-api-proxy |

```js
const DataService = F.service.Data;    
const groupScopeDataService = new DataService({    
    name: 'some-name', 
    scope: DataService.SCOPES.GROUP,   
});    
const userScopeDataService = new DataService({     
    name: 'some-name', 
    scope: DataService.SCOPES.USER,    
});  
```