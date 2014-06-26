(function() {

    var CookieStore = F.store.Cookie;

    describe('Cookie Service', function () {

        var cs;
        before(function () {
            cs = new CookieStore({
                domain: null //for testing locally
            });
        });

        after(function () {
            cs = null;
        });

        describe('#set & #get()', function () {
            it('sets strings with keys', function () {
               cs.set('test', 'key');
               cs.get('test').should.equal('key');
            });
        });

        describe('#delete', function () {
            it('deletes items', function () {
                cs.set('test', 'key');
                cs.get('test').should.equal('key');
                cs.remove('test');
                should.not.exist( cs.get('test'));
            });
        });

        describe('#destroy', function () {
            it('destroys all items', function () {
               cs.set('test', 'key');
               cs.set('test2', 'key2');
               cs.destroy();

               should.not.exist(cs.get('test'));
               should.not.exist(cs.get('test2'));
            });
        });

    });
}());
