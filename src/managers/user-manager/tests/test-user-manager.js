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
    });
});