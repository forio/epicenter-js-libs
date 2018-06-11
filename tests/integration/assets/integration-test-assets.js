'use strict';

$(function () {
    var server = {
        server: {
            host: 'api.forio.com'
        },
        account: 'forio-dev',
        project: 'dummy'
    };
    var credentials = {
        userName: 'ricardo001',
        password: 'test1234'
    };

    var scopes = {
        user: 'User',
        group: 'Group',
        project: 'Project'
    };

    var AssetView = function () {
        var $el = $('#content');
        var $loginEl = $('#loginModal');

        return {
            assetAdapter: null,

            init: function () {
                $('.btn-primary', $loginEl).on('click', $.proxy(this.login, this));
                $('.list [name=scope]').on('change', $.proxy(this.listAssets, this));
                $('.upload form').on('submit', $.proxy(this.uploadFile, this));
                $loginEl.modal({
                    backdrop: 'static',
                    keyboard: false
                });

                //Populate scopes
                var scopeEl = $('[name=scope]');
                for (var key in scopes) {
                    var opt = $('<option></option>');
                    opt.attr('value', key)
                        .html(scopes[key]);
                    scopeEl.append(opt);
                }
            },

            login: function () {
                var am = new F.manager.AuthManager(server);
                var _this = this;
                am.login({
                    userName: $('#txtUsername').val(),
                    password: $('#txtPassword').val(),
                }).then(function (response) {
                    $loginEl.modal('hide');
                    $('.status').append('<div class="alert alert-success">Logged in as: ' + credentials.userName + '</div>');
                    _this.assetAdapter = new F.service.Asset(server);
                    _this.listAssets();
                }).fail(function () {
                    $('.modal-status').append('<div class="alert alert-danger">Invalid username or password</div>');
                });
            },

            listAssets: function () {
                var scope = $('.list [name=scope]').val() || 'user';
                var imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'bmp'];
                $('.images').empty();

                this.assetAdapter.list({ scope: scope }).then(function (response) {
                    $.each(response, function () {
                        var url = this;
                        var filename = url.substring(url.lastIndexOf('/') + 1);
                        var extension = filename.substring(filename.lastIndexOf('.') + 1);
                        var item = $('<div class="file col-sm-2"></div>');
                        if (imageExtensions.indexOf(extension) > -1) {
                            item.append('<img class="thumb" src="' + url + '" alt="Asset">');
                        } else {
                            item.append('<i class="thumb fa fa-file-o"></i>');
                        }

                        item.append('<span>' + filename + '</span>');
                        $('.images').append(item);
                    });

                    if (!response || response.length === 0) {
                        $('.images').append('<div class="alert alert-warning">No assets found for the scope.</div>');
                    }
                }).fail(function (xhr, textStatys, errorThrown) {
                    $('.status').html('<div class="alert alert-warning">The server returned an error: ' + errorThrown + '.</div>');
                });
            },

            uploadFile: function (e) {
                e.preventDefault();
                var _this = this;
                var filename = $('#filename').val();
                var scope = $('#uploadScope').val();
                var data = new FormData();
                var inputControl = $('#fileUpload')[0];
                // You need to set the filename through the FormData object
                // As the API is not able to set the filename in the URL
                data.append('file', inputControl.files[0], filename);

                try {
                    // filename will be ignored if it's a multipart/form-data request
                    this.assetAdapter.create(filename, data, { scope: scope }).then(function () {
                        $('.status').html('<div class="alert alert-success">File uploaded! Reloading assets... </div>');
                        $('.list [name=scope]').val(scope);
                        _this.listAssets();
                    }).fail(function (xhr, textStatys, errorThrown) {
                        $('.status').html('<div class="alert alert-warning">The server returned an error: ' + errorThrown + '.</div>');
                    });
                } catch (err) {
                    $('.status').html('<div class="alert alert-danger">' + err + '</div>');
                }
            }
        };
    };

    var view = new AssetView();
    view.init();

    // var extra = {
    //     group: 'test-ricardo',
    //     project: 'dummy',
    //     transport: {
    //         contentType: 'application/json'
    //     }
    // };
    // var aa = new F.service.Asset($.extend(server, extra));
    // aa.create('test.txt', { encoding: 'BASE_64', data: 'VGhpcyBpcyBhIHRlc3QgZmlsZS4=' }, { scope: 'user' });
    //aa.delete('test1.txt', { scope: 'user' });
    // aa.list({ scope: 'user', fullUrl: true }).then(function (response) {
    //     console.log(response);
    // });
});
