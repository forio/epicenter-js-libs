import AccountService from '../index';
import URLService from 'service/url-config-service';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

const { expect } = chai;

describe('Account API Service', function () {
    const account = 'myaccount';
    const urlService = new URLService({ accountPath: account });
    const baseURL = urlService.getAPIPath('account');

    const defaultParams = {
        account: account,
    };

    function createAccountService(params) {
        const so = params === null ? undefined : Object.assign({}, defaultParams, params);
        return new AccountService(so);
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

    it('should pass through string tokens', function () {
        const ps = createAccountService({ token: 'abc' });
        ps.getAccountSettings();

        var req = server.requests.pop();
        expect(req.requestHeaders.Authorization).to.equal('Bearer abc');

        const ps2 = createAccountService();
        ps2.getAccountSettings();

        req = server.requests.pop();
        expect(req.requestHeaders.Authorization).to.not.exist;
    });

    describe('#getAccountSettings', function () {
        it('should do a GET', function () {
            const ps = createAccountService({ account: 'myaccount' });
            ps.getAccountSettings();

            const req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('GET');
            expect(req.url).to.equal(`${baseURL}myaccount`);
        });
        it('should allow overriding service options', ()=> {
            const ps = createAccountService();
            ps.getAccountSettings({ account: 'foobar' });

            const req = server.requests.pop();
            expect(req.url).to.equal(`${baseURL}foobar`);
        });
    });
});
