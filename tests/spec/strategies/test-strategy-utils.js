(function () {
    var utils = F._private.strategyutils;

    describe('Strategy Utils', function () {
        describe.only('#injectScopeFromSession', function () {
            var injectScopeFromSession = utils.injectScopeFromSession;
            it('should add group if available', function () {
                var op = injectScopeFromSession({ foo: 'bar' }, { groupName: 'blah' });
                expect(op).to.eql({
                    foo: 'bar',
                    scope: { group: 'blah' }
                });
            });
        });
    });
}());
