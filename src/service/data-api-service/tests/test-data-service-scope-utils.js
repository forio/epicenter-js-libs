import { SCOPES, addScopeToCollection, getScopedName } from '../data-service-scope-utils';
import { expect } from 'chai';

describe('Data API Scope utils test', ()=> {
    const sampleSession = {
        groupId: 'mygrpid',
        userId: 'userid'
    };

    describe('#addScopeToCollection', ()=> {
        it('should throw an error when trying to access scoped collections without a session', ()=> {
            const fn = ()=> addScopeToCollection('foobar', SCOPES.GROUP, {});
            const fn1 = ()=> addScopeToCollection('foobar', SCOPES.USER, {});
            const fn2 = ()=> addScopeToCollection('foobar', SCOPES.PROJECT, {});
            const fn3 = ()=> addScopeToCollection('foobar', SCOPES.FACILITATOR, {});
            expect(fn).to.throw(/Authorization/i);
            expect(fn1).to.throw(/Authorization/i);
            expect(fn2).to.throw(/Authorization/i);
            expect(fn3).to.throw(/Authorization/i);
        });
        it('should require facilitator access for facilitator scope', ()=> {
            const fn = ()=> addScopeToCollection('foobar', SCOPES.FACILITATOR, { groupId: 'myGroupId', userId: 'userId' });
            const fn2 = ()=> addScopeToCollection('foobar', SCOPES.FACILITATOR, { isFac: true, groupId: 'myGroupId', userId: 'userId' });
            expect(fn).to.throw(/Authorization/i);
            expect(fn2).to.not.throw(/Authorization/i);
        });
        it('should allow access to custom collections without a session', ()=> {
            const fn = ()=> addScopeToCollection('foobar', SCOPES.CUSTOM, {});
            expect(fn).to.not.throw(/Authorization/i);
        });
      
        it('should add groupid for group scope', ()=> {
            const scoped = addScopeToCollection('foobar', SCOPES.GROUP, sampleSession);
            expect(scoped).to.equal('foobar_group_mygrpid');
        });
        it('should add groupid for fac scope', ()=> {
            const scoped = addScopeToCollection('foobar', SCOPES.FACILITATOR, {
                groupId: 'mygrpid',
                userId: 'myuserid',
                isFac: true,
            });
            expect(scoped).to.equal('foobar_fac_group_mygrpid');
        });
        it('should add groupid and userid for user scope', ()=> {
            const scoped = addScopeToCollection('foobar', SCOPES.USER, sampleSession);
            expect(scoped).to.equal('foobar_user_userid_group_mygrpid');
        });
        it('should add project for project scope', ()=> {
            const scoped = addScopeToCollection('foobar', SCOPES.PROJECT, sampleSession);
            expect(scoped).to.equal('foobar_project_scope');
        });
        it('should echo back key for custom scope', ()=> {
            const scoped = addScopeToCollection('foobar', SCOPES.CUSTOM, {
                groupId: 'mygrpid',
                userId: 'myuserId',
            });
            expect(scoped).to.equal('foobar');
        });
    });
    describe('#getScopedName', ()=> {
        it('should add scope if just passed collection name', ()=> {
            const scope1 = getScopedName('foobar', SCOPES.PROJECT, sampleSession);
            const scope2 = getScopedName('foobar/', SCOPES.PROJECT, sampleSession);
            expect(scope1).to.equal('foobar_project_scope');
            expect(scope2).to.equal('foobar_project_scope/');
        });
        it('should add scope if passed collectionName/doc', ()=> {
            const scope1 = getScopedName('foobar/somedocid', SCOPES.PROJECT, sampleSession);
            const scope2 = getScopedName('foobar/somedocid/', SCOPES.PROJECT, sampleSession);
            expect(scope1).to.equal('foobar_project_scope/somedocid');
            expect(scope2).to.equal('foobar_project_scope/somedocid/');
            
        });
        it('should add scope if passed collectionName/doc/subPath', ()=> {
            const scope1 = getScopedName('foobar/somedocid/some/long/sub/path', SCOPES.PROJECT, sampleSession);
            const scope2 = getScopedName('foobar/somedocid/some/long/sub/path/', SCOPES.PROJECT, sampleSession);
            expect(scope1).to.equal('foobar_project_scope/somedocid/some/long/sub/path');
            expect(scope2).to.equal('foobar_project_scope/somedocid/some/long/sub/path/');
        });
    });
});