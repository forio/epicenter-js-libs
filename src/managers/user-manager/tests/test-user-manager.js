import sinon from 'sinon';
import chai, { expect } from 'chai';
chai.use(require('sinon-chai'));

import UserManager, { parseUsers } from '../index';

describe('User Manager', ()=> {
    function makeManager() {
        const um = new UserManager({
            account: 'myaccount',
            project: 'myproject'
        });
        return um;
    }

    var server;
    before(function () {
        server = sinon.fakeServer.create();
        server.respondWith('POST', /(.*)\/user\/(.*)/, function (xhr) {
            const buckets = [[], [], [], []];
            const body = JSON.parse(xhr.requestBody);
            body.map((u)=> (Object.assign(u, { id: u.userName }))).forEach((user, index)=> {
                const bucket = index % buckets.length;
                buckets[bucket].push(user);
            });
            xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify({
                saved: buckets[0],
                duplicate: buckets[1],
                errors: buckets[2],
                updated: buckets[3],
            }));
        });
        server.respondWith('POST', /(.*)\/member\/local\/somegroup/, function (xhr, id) {
            xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify({
                message: 'Success'
            }));
        });
        server.respondWith('POST', /(.*)\/member\/local\/groupWithLimit/, function (xhr, id) {
            xhr.respond(400, { 'Content-Type': 'application/json' }, JSON.stringify({
                message: 'You have exceeded your group limit(2)'
            }));
        });

        server.respondImmediately = true;
    });

    after(function () {
        server.restore();
    });
    afterEach(()=> {
        server.requests = [];
    });
    describe('#parseUsers', ()=> {
        it('should take in TSV', ()=> {
            const op = parseUsers([
                ['jmith', 'john', 'smith', 'a'].join('\t'),
                ['jmith2', 'john2', 'smith2', 'a2'].join('\t'),
            ].join('\n'));
            expect(op.valid.length).to.equal(2);
            expect(op.invalid.length).to.equal(0);

            const { valid } = op;
            expect(valid[0].userName).to.equal('jmith');
            expect(valid[1].userName).to.equal('jmith2');
            expect(valid[1].password).to.equal('a2');
        });
        it('should take in CSV', ()=> {
            const op = parseUsers([
                ['jmith', 'john', 'smith', 'a'].join(','),
                ['jmith2', 'john2', 'smith2', 'a2'].join(','),
            ].join('\n'));
            expect(op.valid.length).to.equal(2);
            expect(op.invalid.length).to.equal(0);

            const { valid } = op;
            expect(valid[0].userName).to.equal('jmith');
            expect(valid[1].userName).to.equal('jmith2');
            expect(valid[1].password).to.equal('a2');
        });
        it('should take in mixed Tabs and commas', ()=> {
            const op = parseUsers([
                ['jmith', 'john', 'smith', 'a'].join('\t'),
                ['jmith2', 'john2', 'smith2', 'a2'].join(','),
            ].join('\n'));
            expect(op.valid.length).to.equal(2);
            expect(op.invalid.length).to.equal(0);

            const { valid } = op;
            expect(valid[0].userName).to.equal('jmith');
            expect(valid[1].userName).to.equal('jmith2');
            expect(valid[1].password).to.equal('a2');
        });

        it('should catch rows with missing fields', ()=> {
            const op = parseUsers([
                ['jmith', 'john', 'smith', 'a'].join('\t'),
                ['jmith2', 'john2'].join(','),
            ].join('\n'));
            expect(op.valid.length).to.equal(1);
            expect(op.invalid.length).to.equal(1);

            const { valid, invalid } = op;
            expect(valid[0].userName).to.equal('jmith');
            expect(invalid[0].userName).to.equal('jmith2');
            expect(invalid[0].reason).to.equal('MISSING_FIELDS');
            expect(invalid[0].context.missingFields).to.eql(['Last Name', 'Password']);
        });
    });
    describe('#uploadUsers', ()=> {
        it('should reject if called with nothing', ()=> {
            const sucessSpy = sinon.spy();
            const failSpy = sinon.spy((e)=> e);
            const um = makeManager();
            return um.uploadUsers().then(sucessSpy, failSpy).then((r)=> {
                expect(sucessSpy).to.not.have.been.called;
                expect(failSpy).to.have.been.calledOnce;

                const args = failSpy.getCall(0).args[0];
                expect(args.error).to.match(/no users/i);
            });
        });
        it('should call user api with valid users', ()=> {
            const users = [
                ['jmith', 'john', 'smith', 'a'].join(','),
                ['jmith2', 'john2', 'smith2', 'a2'].join(','),
            ].join('\n');
            const um = makeManager();
            return um.uploadUsers(users, 'somegroup').then((r)=> {
                const userReq = server.requests[0];
                expect(userReq.requestBody).to.equal(JSON.stringify([
                    { userName: 'jmith', firstName: 'john', lastName: 'smith', password: 'a', account: 'myaccount' },
                    { userName: 'jmith2', firstName: 'john2', lastName: 'smith2', password: 'a2', account: 'myaccount' },
                ]));
            });
        });
        it('should call member api with saved users', ()=> {
            const users = [
                ['jmith', 'john', 'smith', 'a'].join(','),
                ['jmith2', 'john2', 'smith2', 'a2'].join(','),
                ['jmith3', 'john3', 'smith3', 'a3'].join(','),
                ['jmith4', 'john4', 'smith4', 'a4'].join(','),
            ].join('\n');
            const um = makeManager();
            return um.uploadUsers(users, 'somegroup').then((r)=> {
                const memberReq = server.requests[1];
                expect(memberReq.requestBody).to.equal(JSON.stringify([{ userId: 'jmith' }, { userId: 'jmith4' }, { userId: 'jmith2' }]));
            });
        });
        it('should handle group expiry messages', ()=> {
            const users = [
                ['jmith', 'john', 'smith', 'a'].join(','), //saved
                ['jmith2', 'john2', 'smith2', 'a2'].join(','), //updated
                ['jmith3', 'john3', 'smith3', 'a3'].join(','), //duplicate & rejected by group, so move to error
                ['jmith4', 'john4', 'smith4', 'a4'].join(','), //error
            ].join('\n');
            const um = makeManager();
            return um.uploadUsers(users, 'groupWithLimit').then((r)=> {
                expect(r.created.length).to.equal(2);
                expect(r.errors.length).to.equal(2);
                expect(r.errors[0].reason).to.equal('API_REJECT');
                expect(r.errors[1].reason).to.equal('GROUP_LIMIT_HIT');

            });
        });
    });
});