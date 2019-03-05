## Data API Service

The Data API Service allows you to create, access, and manipulate data related to any of your projects. Data are organized in collections. Each collection contains a document; each element of this top-level document is a JSON object. (See additional information on the underlying [Data API](../../../rest_apis/data_api/).)

**Example**:

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

### Scoping:

The `scope` parameter determines who has read-write access to this data collection. Available scopes are:

| Scope | Readable By | Writable By
| ------------- | ------------- | ------------- |
| GROUP | Facilitators & Users in that group | Facilitators in that group|
| USER | Faciliator in that group. User who created the collection | Faciliator in that group. User who created the collection |
| FACILITATOR | Facilitators in that group | Facilitators in that group |
| PROJECT (default, for legacy reasons) | Any user in the project | Any user in the project |
| CUSTOM (to opt out of naming conventions) | customize with Epicenter-api-proxy | customize with Epicenter-api-proxy |

**Example**:

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