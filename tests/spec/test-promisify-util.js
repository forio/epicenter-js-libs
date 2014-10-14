(function() {
    'use strict';

    var futil = F.util;

    describe('Promisify utilities', function () {
        var MockFunction;
        var clock;
        var SLOW, MEDIUM, FAST;
        before(function() {
            SLOW = 300;
            MEDIUM = 200;
            FAST = 100;

            clock = sinon.useFakeTimers();

            MockFunction = function() {
                var publicAPI = {

                    doSlow: function(echo) {
                        var $d= $.Deferred();
                        setTimeout(function() {
                            // console.log('slow');
                            $d.resolve(echo);
                        }, SLOW);
                        return $d.promise();
                    },
                    doMedium: function(echo) {
                        var $d= $.Deferred();
                        setTimeout(function() {
                            $d.resolve(echo);
                        }, MEDIUM);
                        return $d.promise();
                    },
                    doFast: function(echo) {
                        var $d= $.Deferred();
                        setTimeout(function() {
                            // console.log('fast');
                            $d.resolve(echo);
                        }, FAST);
                        return $d.promise();
                    },
                    doNow: function() {
                       return 42;
                    }
                };
                $.extend(this, publicAPI);
                futil.promisify(this);
            };

            window.mf = MockFunction;
            window.m  = new MockFunction();

        });
        after(function() {
            MockFunction = null;
            clock.restore();
        });

        describe('then', function () {
            it('should be thenable', function() {
                var cb = sinon.spy();
                var mf = new MockFunction();
                mf.doFast('fast').then(cb);

                clock.tick(FAST);

                cb.should.have.been.called;
                cb.should.have.been.calledWith('fast');
                cb.should.have.been.calledOn(mf);
            });

            it('should chain thens', function () {
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();
                var mf = new MockFunction();
                mf.doFast('fast').then(cb1).then(cb2);

                clock.tick(FAST);

                cb1.should.have.been.called;
                cb2.should.have.been.called;
            });

            it('should pass the result of previous function to then', function () {
                var cb1 = sinon.spy(function() {
                    return 42;
                });
                var cb2 = sinon.spy();
                var cb3 = sinon.spy();
                var mf = new MockFunction();
                mf.doFast('fast').then(cb1).then(cb2).then(cb3);

                clock.tick(FAST);

                cb1.should.have.been.calledWith('fast');
                cb2.should.have.been.calledWith(42);
                cb2.should.have.been.calledWith(42); //Should this be undefined?
            });


            it('should return itself on then', function () {
                var cb1 = sinon.spy();
                var mf = new MockFunction();
                var ret = mf.doFast('fast').then(cb1);

                clock.tick(FAST);

                ret.should.be.instanceof(MockFunction);
            });
        });


        it('should chain its own functions', function () {
            var mf = new MockFunction();
            var slowSpy = sinon.spy(mf, 'doSlow');

            var slow = slowSpy('slow');

            var fastSpy = sinon.spy(slow, 'doFast');
            var fast = fastSpy('fast');

            var mediumSpy = sinon.spy(fast, 'doMedium');
            mediumSpy('medium');

            slowSpy.should.have.been.called;
            slowSpy.should.have.been.calledWith('slow');

            fastSpy.should.have.been.called;
            fastSpy.should.have.been.calledWith('fast');

            mediumSpy.should.have.been.called;
            mediumSpy.should.have.been.calledWith('medium');

        });

        it('should not execute functions till previous completes', function () {
            var cb1 = sinon.spy();
            var cb2 = sinon.spy();
            var mf = new MockFunction();
            // var ret = mf.doFast('fast').then(cb1);
            mf.doSlow('slow').then(cb1).doFast('fast').then(cb2);

            clock.tick(SLOW);
            cb1.should.have.been.called;
            cb2.should.not.have.been.called;

            clock.tick(FAST);
            cb2.should.have.been.called;

            cb1.should.have.been.calledBefore(cb2);
        });

        it('should have executed chained functions in the right order', function () {
            var mf = new MockFunction();

            // mf.doSlow().doFast().doMedium();

            var slowSpy = sinon.spy(mf, 'doSlow');

            var slow = slowSpy('slow');

            var fastSpy = sinon.spy(slow, 'doFast');
            var fast = fastSpy('fast');

            var mediumSpy = sinon.spy(fast, 'doMedium');
            mediumSpy('medium');

            slowSpy.should.have.been.calledBefore(fastSpy);
            slowSpy.should.have.been.calledBefore(mediumSpy);

            fastSpy.should.have.been.calledBefore(mediumSpy);
        });

        // it('should call the same fn twice', function () {
        //     var mf = new MockFunction();
        //     var fastSpy = sinon.spy(mf, 'doFast');
        //     var fastSpy2 = sinon.spy(fastSpy, 'doFast');

        //     mf.doFast().doFast();

        //     fastSpy.should.have.been.called;
        //     fastSpy2.should.have.been.called;
        // });



        it.skip('should run multiple queries in parallel', function () {
            var mf = new MockFunction();
            var cb1 = sinon.spy();
            var cb2 = sinon.spy();

            mf.doFast(1).then(cb1);
            mf.doFast(2).then(cb2);

            clock.tick(FAST);

            cb1.should.have.been.called;
            cb2.should.have.been.called;
        });
        // describe('Synchronous functions', function () {
        //     it('should not be thenable', function () {
        //         var mf = new MockFunction();
        //         var ret = mf.doNow();

        //         ret.should.equal(42);
        //     });
        // });
    });
}());
