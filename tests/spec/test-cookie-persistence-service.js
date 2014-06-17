(function() {

    var CookieService = F.service.Cookie;

    describe('Cookie Service', function () {

        var cs;
        before(function () {
            cs = new CookieService({
                domain: null //for testing locally
            });
        });

        after(function () {
            cs = null;
        });

        describe('#save & #load()', function () {
            it('saves strings with keys', function () {
               cs.save('test', 'key').then(function() {
                    cs.load('test').then(function(value) {
                        value.should.equal('key');
                    });
               });
            });
        });

        describe('#delete', function () {
            it('deletes items', function () {
               cs.save('test', 'key').then(function() {
                    cs.load('test').then(function(value) {
                        value.should.equal('key');
                        cs.remove('test').then(function(value) {
                            cs.load('test').then(function(value) {
                                should.not.exist(value);
                            });
                        });
                    });
               });
            });
        });

        describe('#destroy', function () {
            it('destroys all items', function () {
               cs.save('test', 'key').then(function() {
                    cs.save('test2', 'key2').then(function() {
                        cs.destroy().then(function() {
                            cs.load('test').then(function(value) {
                                should.not.exist(value);
                            });
                            cs.load('test2').then(function(value) {
                                should.not.exist(value);
                            });
                        });
                    });
               });
            });
        });
    });
}());
