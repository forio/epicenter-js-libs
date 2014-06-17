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

        describe('success callbacks', function() {
            it('#save', function () {
                var callback = sinon.spy();
                cs.save('test', 'key', {success: callback});
                callback.should.have.been.called;
                callback.should.have.been.calledOn(cs);
            });

            it('#load', function () {
                cs.save('loadtest', 'key', {success: function(){
                    var callback = sinon.spy();
                    cs.load('loadtest', {success: callback});
                    callback.should.have.been.called;
                    callback.should.have.been.calledWith('key');
                    callback.should.have.been.calledOn(cs);
                }});
            });
            it('#remove', function () {
                cs.save('test', 'key', {success: function(){
                    var callback = sinon.spy();
                    cs.remove('test', {success: callback});
                    callback.should.have.been.called;
                    callback.should.have.been.calledWith('test');
                    callback.should.have.been.calledOn(cs);
                }});
            });
            it('#destroy', function () {
                cs.save('loadtest', 'key', {success: function(){
                    var callback = sinon.spy();
                    cs.destroy({success: callback});
                    callback.should.have.been.called;
                    callback.should.have.been.calledWith('loadtest');
                    callback.should.have.been.calledOn(cs);
                }});
            });
        });
    });
}());
