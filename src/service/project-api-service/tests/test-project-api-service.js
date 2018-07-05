import ProjectService from '../index';
import URLService from 'service/url-config-service';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

const { expect } = chai;

describe.only('Project API Service', function () {
    const account = 'myaccount';
    const project = 'myproject';
    const baseURL = (new URLService({ accountPath: account, projectPath: project })).getAPIPath('project');

    const defaultParams = {
        account: account,
        project: project,
    };

    function createProjectService(params) {
        const so = params === null ? undefined : Object.assign({}, defaultParams, params);
        return new ProjectService(so);
    }

    var server;
    before(function () {
        server = sinon.fakeServer.create();
        server.respondWith(/(.*)\/password\/(.*)\/?/, function (xhr, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
        });
    });
    after(function () {
        server.restore();
    });


    describe('#getProjectSettings', function () {
        it('should do a GET', function () {
            const ps = createProjectService();
            ps.getProjectSettings();

            const req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('GET');
            expect(req.url).to.equal(baseURL);
        });
        it('should allow overriding service options', ()=> {
            const ps = createProjectService();
            ps.getProjectSettings({ account: 'foobar' });

            const req = server.requests.pop();
            expect(req.url).to.equal(baseURL.replace(account, 'foobar'));
        });
    });
    describe('#updateProjectSettings', ()=> {
        it('should do a PATCH', function () {
            const ps = createProjectService();
            ps.updateProjectSettings({});

            const req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('PATCH');
            expect(req.url).to.equal(baseURL);
        });
        it('should allow overriding service options', ()=> {
            const ps = createProjectService();
            ps.updateProjectSettings({}, { account: 'foobar' });

            const req = server.requests.pop();
            expect(req.url).to.equal(baseURL.replace(account, 'foobar'));
        });
        it('should pass in params as patch both', ()=> {
            const ps = createProjectService();
            ps.updateProjectSettings({
                foo: 'bar'
            }, { account: 'foobar' });

            const req = server.requests.pop();
            expect(req.requestBody).to.equal(JSON.stringify({ foo: 'bar' }));
        });
    });
});
