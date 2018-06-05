import PasswordService from '../index';
import URLService from 'service/url-config-service';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

const { expect } = chai;

describe('Password API API', function () {
    const account = 'forio';
    const project = 'js-libs';
    const baseURL = (new URLService({ accountPath: account, projectPath: project })).getAPIPath('password');

    const defaultParams = {
        account: account,
        project: project,
    };

    function createPasswordService(params) {
        const so = params === null ? undefined : Object.assign({}, defaultParams, params);
        return new PasswordService(so);
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


    describe('#resetPassword', function () {
        it('should throw an error if required fields are  not specified', function () {
            const ps = createPasswordService();
            expect(()=> ps.resetPassword()).to.throw(/Missing required/);
            expect(()=> ps.resetPassword('myUserName')).to.throw(/Missing required/);
            expect(()=> ps.resetPassword('myUserName', { redirectURL: 'login.html' })).to.not.throw;
        });
        it('should do a POST', function () {
            const ps = createPasswordService();
            ps.resetPassword('myUserName', { redirectURL: 'login.html' });

            const req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('POST');
            expect(req.url).to.equal(`${baseURL}recovery/`);
        });
        it('should pass account from original options if not specified in POST', ()=> {
            const ps = createPasswordService();
            ps.resetPassword('myUserName', { redirectURL: 'login.html' });

            const req = server.requests.pop();
            const params = JSON.parse(req.requestBody);
            expect(params.account).to.equal(account);
        });
        describe('redirectURL', ()=> {
            it('should accept relative redirect urls', ()=> {
                const ps = createPasswordService();
                ps.resetPassword('myUserName', { redirectURL: 'login.html' });
    
                const req = server.requests.pop();
                const params = JSON.parse(req.requestBody);
                expect(params.redirectURL).to.equal(`https://forio.com/${account}/${project}/login.html`);
            });
            it('should allow leading slash in relative url', ()=> {
                const ps = createPasswordService();
                ps.resetPassword('myUserName', { redirectURL: '/bar/login.html' });
    
                const req = server.requests.pop();
                const params = JSON.parse(req.requestBody);
                expect(params.redirectURL).to.equal(`https://forio.com/${account}/${project}/bar/login.html`);
            });
            it('should accept absolute redirect urls', ()=> {
                const ps = createPasswordService();
                ps.resetPassword('myUserName', { redirectURL: 'http://bar.com' });
    
                const req = server.requests.pop();
                const params = JSON.parse(req.requestBody);
                expect(params.redirectURL).to.equal('http://bar.com');
            });
        });
       
        it('should POST required parameters', ()=> {
            const ps = createPasswordService();
            ps.resetPassword('myUserName', { redirectURL: 'http://bar.com', subject: 'foo', projectFullName: 'bar', something: 'ignored' });

            const req = server.requests.pop();
            const params = JSON.parse(req.requestBody);
            expect(params).to.eql({
                account: 'forio',
                userName: 'myUserName',
                redirectURL: 'http://bar.com',
                subject: 'foo',
                projectFullName: 'bar',
            });
        });
    });
});
