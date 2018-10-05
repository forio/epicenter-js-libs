
import RunService from 'service/run-api-service';

import { injectScopeFromSession, injectFiltersFromSession, mergeRunOptions } from '../strategy-utils';

import chai from 'chai';

const { expect } = chai;

describe('Strategy Utils', function () {
    describe('#injectScopeFromSession', function () {
        it('should add group if available', function () {
            var op = injectScopeFromSession({ foo: 'bar' }, { groupName: 'blah' });
            expect(op).to.eql({
                foo: 'bar',
                scope: { group: 'blah' }
            });
        });
        it('should leave original object along if no group available', function () {
            var op = injectScopeFromSession({ foo: 'bar' });
            expect(op).to.eql({
                foo: 'bar',
            });
        });
    });
    describe('#injectFiltersFromSession', function () {
        describe('Group scope', function () {
            it('should add group scope if provided', function () {
                var op = injectFiltersFromSession({ foo: 'bar' }, { groupName: 'blah' });
                expect(op).to.eql({
                    foo: 'bar',
                    scope: {
                        group: 'blah'
                    }
                });
            });
            it('should merge with existing scope', function () {
                var op = injectFiltersFromSession({ foo: 'bar', scope: { trackingKey: 'mykey' } }, { groupName: 'blah' });
                expect(op).to.eql({
                    foo: 'bar',
                    scope: {
                        trackingKey: 'mykey',
                        group: 'blah'
                    }
                });
            });
            it('should not add scope if `scopeByGroup` is false', function () {
                var op = injectFiltersFromSession({ foo: 'bar' }, { groupName: 'blah' }, { scopeByGroup: false });
                expect(op).to.eql({
                    foo: 'bar',
                });
            });
            it('should not add scope if none provided', function () {
                var op = injectFiltersFromSession({ foo: 'bar' });
                expect(op).to.eql({
                    foo: 'bar',
                });
            });
        });
        describe('User scope', function () {
            it('should add group scope if provided', function () {
                var op = injectFiltersFromSession({ foo: 'bar' }, { userId: 'blah' });
                expect(op).to.eql({
                    foo: 'bar',
                    'user.id': 'blah'
                });
            });
            it('should not add scope if `scopeByUser` is false', function () {
                var op = injectFiltersFromSession({ foo: 'bar' }, { userId: 'blah' }, { scopeByUser: false });
                expect(op).to.eql({
                    foo: 'bar',
                });
            });
            it('should not add scope if none provided', function () {
                var op = injectFiltersFromSession({ foo: 'bar' });
                expect(op).to.eql({
                    foo: 'bar',
                });
            });
        });
    });
    describe('#mergeRunOptions', function () {
        it('should update runservice config if provided', function () {
            var rs = new RunService({ account: 'foo', project: 'bar' });
            var op = mergeRunOptions(rs, { adam: 'west', account: 'batcave' });
            expect(op).to.be.instanceOf(RunService);

            var config = op.getCurrentConfig();
            expect(config.adam).to.equal('west');
            expect(config.account).to.equal('batcave');
        });
        it('should update obj if provider', function () {
            var op = mergeRunOptions({ foo: 'bar' }, { adam: 'west' });
            expect(op).to.eql({ foo: 'bar', adam: 'west' });
        });
    });
});
