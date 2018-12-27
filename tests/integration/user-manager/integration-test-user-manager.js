const runOptions = {
    account: $('#txtAccount').val(),
    project: $('#txtProject').val(),
};

$('#btn-upload-users').on('click', (evt)=> {
    evt.preventDefault();
    const contents = $('textarea').val();
    if (!contents) {
        alert('No users specified to upload');
        return;
    }

    const um = new F.manager.User(runOptions);
    um.uploadUsersToGroup(contents).then((res)=> {
        alert('Upload success, see console for output');
        console.log('Upload success', res);
    }).catch((res)=> {
        console.error(res, 'upload error');
        alert('Error, see console');
    });
});