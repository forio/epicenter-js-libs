
import DataService from '../index';
import URLService from 'service/url-config-service';

import sinon from 'sinon';
import chai, { expect } from 'chai';
chai.use(require('sinon-chai'));

var account = 'forio';
var project = 'js-libs';

var baseURL = (new URLService({ accountPath: account, projectPath: project })).getAPIPath('data');
describe('Data API Service', function () {
    var server;
    before(function () {
        server = sinon.fakeServer.create();
        server.respondWith(/(.*)\/data\/(.*)\/(.*)/, function (xhr, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
        });
    });

    after(function () {
        server.restore();
    });

    it('should pass through string tokens', function () {
        var ds = new DataService({ root: 'person', account: account, project: project, token: 'abc' });
        ds.load('name');

        var req = server.requests.pop();
        req.requestHeaders.Authorization.should.equal('Bearer abc');
    });

    it('should pass in transport options to the underlying ajax handler', function () {
        var callback = sinon.spy();
        var ds = new DataService({ root: 'person', account: account, project: project, transport: { beforeSend: callback } });
        ds.load('name');

        server.respond();
        callback.should.have.been.called;
    });

    describe('#load', function () {
        it('Should do a GET', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.load('name');

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('GET');
        });

        it('should hit the right url', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.load('name');

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'person/name/');
        });

        it('should allow overriding the root', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.load('name', null, { root: 'people/me/' });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'people/me/name/');
        });

        it('should support nested urls', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.load('first/name');

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'person/first/name/');
        });

        it('should support url parameters', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.load('first/name', { page: 1 });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'person/first/name/?page=1');
        });

        it('should support url parameters with objects', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.load('first/name', { page: 1, sort: { fieldName1: 1, fieldName2: -1 } });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'person/first/name/?page=1&sort={"fieldName1":1,"fieldName2":-1}');
        });
    });

    describe('#save', function () {
        it('Should do a POST', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.save('name', 'John');

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('POST');
        });
        it('Should send key,value requests in body', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.save('name', 'John');

            var req = server.requests.pop();
            req.requestBody.should.equal(JSON.stringify({ name: 'John' }));
        });

        it('Should send object requests in body', function () {
            var params = { fname: 'john', lname: 'smith' };
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.save(params);

            var req = server.requests.pop();
            req.requestBody.should.equal(JSON.stringify(params));
        });

        it('should allow overriding the root', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.save('name', 'john', { root: 'people/me/' });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'people/me/');
            req.requestBody.should.equal(JSON.stringify({ name: 'john' }));

        });
    });

    describe('#saveAs', function () {
        it('Should do a PUT', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.saveAs('user', { name: 'john' });

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('PUT');
        });
        it('Should send key,value requests in body', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.saveAs('user', { name: 'john' });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'person/user/');
            req.requestBody.should.equal(JSON.stringify({ name: 'john' }));
        });

        it('should allow overriding the root', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.saveAs('user', { name: 'john' }, { root: 'people/me' });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'people/me/user/');
            req.requestBody.should.equal(JSON.stringify({ name: 'john' }));
        });
    });

    describe('#remove', function () {
        it('Should do a DELETE', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.remove('name');

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('DELETE');
        });

        it('Should remove single keys from collection', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.remove('name');

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'person/name/');
        });

        it('Should remove multiple keys from collection', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.remove(['name', 'age']);

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'person/?id=name,age');
        });

        it('Should remove nested keys from collection', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.remove('first/name');

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'person/first/name/');
        });

        it('should allow overriding the root', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.remove('user', { root: 'people/me' });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'people/me/user/');
        });
    });

    describe('#query', function () {
        it('Should do a GET', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.query('', { name: 'john' });

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('GET');
        });
        it('should hit the right url', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.query('', { name: 'john' });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'person/?q={"name":"john"}');
        });
        it('should support output modifiers', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.query('', { name: 'john', age: '10' }, { page: 1 });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'person/?q={"name":"john","age":"10"}&page=1');
        });
        it('should support keys', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.query('a/b', { name: 'john', age: '10' }, { page: 1 });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'person/a/b/?q={"name":"john","age":"10"}&page=1');
        });

        it('should allow overriding the root', function () {
            var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
            ds.query('user', { name: 'john', age: '10' }, null, { root: 'people/me' });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'people/me/user/?q=' + JSON.stringify({ name: 'john', age: '10' }));
        });
    });
    describe('Callbacks', function () {
        describe('#load', function () {
            it('passes success callbacks', function () {
                var cb1 = sinon.spy();
                var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
                ds.load('name', null, { success: cb1 });

                server.respond();
                cb1.called.should.equal(true);
            });
        });

        describe('#save', function () {
            it('passes success callbacks', function () {
                var cb1 = sinon.spy();
                var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
                ds.save('name', 'John', { success: cb1 });

                server.respond();
                cb1.called.should.equal(true);
            });
        });

        describe('#query', function () {
            it('passes success callbacks', function () {
                var cb1 = sinon.spy();
                var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
                ds.query('', { name: 'john' }, { page: 1 }, { success: cb1 });

                server.respond();
                cb1.called.should.equal(true);
            });
        });
        describe('#remove', function () {
            it('passes success callbacks', function () {
                var cb1 = sinon.spy();
                var ds = new DataService({ root: 'person', account: account, project: 'js-libs' });
                ds.remove('name', { success: cb1 });

                server.respond();
                cb1.called.should.equal(true);
            });
        });
        describe('#getScopedName', ()=> {
            it('should return scoped name for collections', ()=> {
                var ds = new DataService({ root: 'person', account: account, scope: DataService.SCOPES.USER, project: 'js-libs' });
                const name = ds.getScopedName({ userId: 'myuserid', groupId: 'mygrp' });
                expect(name).to.equal('person_user_myuserid_group_mygrp');
            });
            it('should allow passing in name and scope through options', ()=> {
                var ds = new DataService({ account: account, project: 'js-libs' });
                const name = ds.getScopedName({ userId: 'myuserid', groupId: 'mygrp' }, {
                    scope: DataService.SCOPES.USER,
                    root: 'person',
                });
                expect(name).to.equal('person_user_myuserid_group_mygrp');
            });
        });
    });
});
