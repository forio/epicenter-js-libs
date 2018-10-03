## Asset API Adapter

The Asset API Adapter allows you to store assets -- resources or files of any kind -- used by a project with a scope that is specific to project, group, or end user.

Assets are used with [team projects](../../../project_admin/#team). One common use case is having end users in a [group](../../../glossary/#groups) or in a [multiplayer world](../../../glossary/#world) upload data -- videos created during game play, profile pictures for customizing their experience, etc. -- as part of playing through the project.

Resources created using the Asset Adapter are scoped:

Project assets are writable only by [team members](../../../glossary/#team), that is, Epicenter authors.
Group assets are writable by anyone with access to the project that is part of that particular [group](../../../glossary/#groups). This includes all [team members](../../../glossary/#team) (Epicenter authors) and any [end users](../../../glossary/#users) who are members of the group -- both facilitators and standard end users.
User assets are writable by the specific end user, and by the facilitator of the group.
All assets are readable by anyone with the exact URI.

To use the Asset Adapter, instantiate it and then access the methods provided. Instantiating requires the account id (**Team ID** in the Epicenter user interface) and project id (**Project ID**). The group name is required for assets with a group scope, and the group name and userId are required for assets with a user scope. If not included, they are taken from the logged in user's session information if needed.

When creating an asset, you can pass in text (encoded data) to the `create()` call. Alternatively, you can make the `create()` call as part of an HTML form and pass in a file uploaded via the form.
``` js
// instantiate the Asset Adapter
var aa = new F.service.Asset({
   account: 'acme-simulations',
   project: 'supply-chain-game',
   group: 'team1',
   userId: '12345'
});

// create a new asset using encoded text
aa.create('test.txt', {
    encoding: 'BASE_64',
    data: 'VGhpcyBpcyBhIHRlc3QgZmlsZS4=',
    contentType: 'text/plain'
}, { scope: 'user' });

// alternatively, create a new asset using a file uploaded through a form
// this sample code goes with an html form that looks like this:
//
// <form id="upload-file">
//   <input id="file" type="file">
//   <input id="filename" type="text" value="myFile.txt">
//   <button type="submit">Upload myFile</button>
// </form>
//
$('#upload-file').on('submit', function (e) {
   e.preventDefault();
   var filename = $('#filename').val();
   var data = new FormData();
   var inputControl = $('#file')[0];
   data.append('file', inputControl.files[0], filename);
   aa.create(filename, data, { scope: 'user' });
});
```