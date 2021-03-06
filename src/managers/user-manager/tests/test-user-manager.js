import sinon from 'sinon';
import chai, { expect } from 'chai';
chai.use(require('sinon-chai'));

import UserManager, { parseUsers } from '../index';

const account = 'myaccount';
describe('User Manager', ()=> {
    function makeManager() {
        const um = new UserManager({
            account: account,
            project: 'myproject'
        });
        return um;
    }

    var server;
    before(function () {
        server = sinon.fakeServer.create();
        server.respondWith('POST', /(.*)\/user\/(.*)/, function (xhr) {
            const buckets = [[], [], []];
            const body = JSON.parse(xhr.requestBody);
            body.map((u)=> (Object.assign(u, { id: u.userName }))).forEach((user, index)=> {
                const bucket = index % buckets.length;
                buckets[bucket].push(user);
            });
            xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify({
                saved: buckets[0],
                duplicate: buckets[1],
                errors: buckets[2],
                updated: [],
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
            return um.uploadUsersToGroup().then(sucessSpy, failSpy).then((r)=> {
                expect(sucessSpy).to.not.have.been.called;
                expect(failSpy).to.have.been.calledOnce;

                const args = failSpy.getCall(0).args[0];
                expect(args.type).to.equal(UserManager.errors.EMPTY_USERS);
            });
        });
        it('should reject if called without a group id', ()=> {
            const sucessSpy = sinon.spy();
            const failSpy = sinon.spy((e)=> e);
            const um = makeManager();
            const users = [
                ['jmith', 'john', 'smith', 'a'].join(','),
                ['jmith2', 'john2', 'smith2', 'a2'].join(','),
            ].join('\n');
            return um.uploadUsersToGroup(users).then(sucessSpy, failSpy).then((r)=> {
                expect(sucessSpy).to.not.have.been.called;
                expect(failSpy).to.have.been.calledOnce;

                const args = failSpy.getCall(0).args[0];
                expect(args.type).to.equal(UserManager.errors.NO_GROUP_PROVIDED);
            });
        });
        it('should call user api with valid users', ()=> {
            const users = [
                ['jmith', 'john', 'smith', 'a'].join(','),
                ['jmith2', 'john2', 'smith2', 'a2'].join(','),
            ].join('\n');
            const um = makeManager();
            return um.uploadUsersToGroup(users, 'somegroup').then((r)=> {
                const userReq = server.requests[0];
                expect(userReq.requestBody).to.equal(JSON.stringify([
                    { userName: 'jmith', firstName: 'john', lastName: 'smith', password: 'a', account: 'myaccount' },
                    { userName: 'jmith2', firstName: 'john2', lastName: 'smith2', password: 'a2', account: 'myaccount' },
                ]));
            });
        });
        it('should call member api with saved users', ()=> {
            const users = [
                ['jmith', 'john', 'smith', 'a'].join(','), //saved
                ['jmith2', 'john2', 'smith2', 'a2'].join(','), //duplicate
                ['jmith3', 'john3', 'smith3', 'a3'].join(','), //errors
                ['jmith4', 'john4', 'smith4', 'a4'].join(','), //saved
            ].join('\n');
            const um = makeManager();
            return um.uploadUsersToGroup(users, 'somegroup').then((r)=> {
                const memberReq = server.requests[1];
                expect(memberReq.requestBody).to.equal(JSON.stringify([{ userId: 'jmith' }, { userId: 'jmith4' }, { userId: 'jmith2' }]));
            });
        });
        it('should return the users as promise response', ()=> {
            function toOP(userStr, account) {
                const lines = userStr.split('\n');
                return lines.map((line)=> {
                    const items = line.split(',');
                    const obj = ['userName', 'firstName', 'lastName', 'password'].reduce((accum, field, index)=> {
                        accum[field] = items[index];
                        return accum;
                    }, { id: null, account: null, userName: null });
                    obj.id = obj.userName;
                    obj.account = account;
                    return obj;
                });
            }
            const users = [
                ['jmith', 'john', 'smith', 'a'].join(','), //saved
                ['jmith2', 'john2', 'smith2', 'a2'].join(','), //dupe
                ['jmith3', 'john3', 'smith3', 'a3'].join(','), //error
                ['jmith4', 'john4', 'smith4', 'a4'].join(','), //saved
            ].join('\n');
            const um = makeManager();
            return um.uploadUsersToGroup(users, 'somegroup').then((r)=> {
                const opFormat = toOP(users, account);
                expect(r).to.eql({
                    created: [
                        opFormat[0],
                        opFormat[3],
                    ],
                    duplicates: [
                        opFormat[1],
                    ],
                    errors: [
                        Object.assign(opFormat[2], { reason: UserManager.errors.API_REJECT })
                    ],
                });
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
            return um.uploadUsersToGroup(users, 'groupWithLimit').then((r)=> {
                expect(r.created.length).to.equal(2);
                expect(r.errors.length).to.equal(2);
                expect(r.errors[0].reason).to.equal(UserManager.errors.API_REJECT);
                expect(r.errors[1].reason).to.equal(UserManager.errors.GROUP_LIMIT_EXCEEDED);

            });
        });
    });
});