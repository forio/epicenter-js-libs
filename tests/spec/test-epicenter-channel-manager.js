(function () {
   'use strict';

    var Manager = F.manager.ChannelManager;
    describe('Epicenter ChannelManager', function () {
        var oldCometd;
        var handshakeSpy = sinon.spy();
        var mockCometd = function () {
            return {
                addListener: sinon.spy(),
                batch: sinon.spy(),
                configure: sinon.spy(),
                resubscribe: sinon.spy(),
                handshake: handshakeSpy,
            };
        };

        before(function () {
            oldCometd = $.Cometd;
            $.Cometd = mockCometd;
        });
        after(function () {
           $.Cometd = oldCometd;
        });
        afterEach(function () {
            Manager.prototype._cometd = null;
        });

        describe('#handshake', function () {
            it('should send authentication parametes', function () {
                var manager = new Manager({ userId: 'userId', token: 'token' });
                handshakeSpy.calledOnce.should.be.true;
                handshakeSpy.getCall(0).args[0].should.be.eql({
                    ext: {
                        userId: 'userId',
                        authorization: 'Bearer token'
                    }
                });
            });
        });

        describe('#getWorldChannel', function () {
            it('should throw an error if world id not provided', function () {
                var manager = new Manager();
                var ret =  function () { manager.getWorldChannel(); };
                ret.should.throw(Error);
            });
            it('should take group name from options if provided', function () {
                var manager = new Manager({
                    account: 'accnt',
                    project: 'prj'
                });
                var wc = manager.getWorldChannel('worldid', 'grpName');
                wc.channelOptions.base.should.equal('/world/accnt/prj/grpName/worldid');
            });
            it('should take group name from session if not provided in options', function () {

            });
        });
        describe('#getUserChannel', function () {
            it('should throw an error if world id not provided', function () {
                var manager = new Manager();
                var ret =  function () { manager.getUserChannel(); };
                ret.should.throw(Error);
            });
            it('should take account and project from options', function () {
                // var manager = new Manager({
                //     account: 'accnt',
                //     project: 'prj'
                // });
                // var wc = manager.getDataChannel('colln');
                // wc.channelOptions.base.getUserChannel.equal('/users/accnt/prj/colln');
            });
        });
        describe('#getDataChannel', function () {
            it('should throw an error if collection not provided', function () {
                var manager = new Manager();
                var ret =  function () { manager.getDataChannel(); };
                ret.should.throw(Error);
            });
            it('should take account and project from options', function () {
                var manager = new Manager({
                    account: 'accnt',
                    project: 'prj'
                });
                var wc = manager.getDataChannel('colln');
                wc.channelOptions.base.should.equal('/data/accnt/prj/colln');
            });
        });
    });
}());
