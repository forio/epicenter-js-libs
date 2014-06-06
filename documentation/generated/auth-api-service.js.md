

#auth-api-service

<!-- module desc -->

Authentication API Service

```
 
 var auth = require('autentication-service')();
 auth.login();

```

##Configuration Options

###store
Where to store tokens for temporary access.

##Methods

###login
@param {String} username LoginID of user

- password: {String} Password

````

````

###logout
Logs user out from specified accounts

- username: {String} (Optional) If provided only logs specific username out, otherwise logs out all usernames associated with session

````

````

###getToken
Returns existing token if already logged in, or creates a new one otherwise

- username: {String} (Optional) Userid to get the token for; if currently logged in as a single user username is optional

````

````

###getUserInfo
Returns user information of

- token: {String} Token obtained as part of logging in

````

````

