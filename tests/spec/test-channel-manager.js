(function () {
   'use strict';

    var Manager = F.manager.ChannelManager;
    describe('ChannelManager', function () {
        var oldCometd;
        var mockCometd = function () {
            var i = Math.random();

            return {
                i: i,
                addListener: sinon.spy(),
                batch: sinon.spy(),
                configure: sinon.spy(),
                resubscribe: sinon.spy(),
                handshake: sinon.spy(),
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

        describe('#shareConnection', function () {
            it('should re-use cometd instances by default', function () {
                var manager1 = new Manager({ shareConnection: true });
                var manager2 = new Manager({ shareConnection: true });

                (manager1.cometd.i).should.equal(manager2.cometd.i);
            });
            it('should not re-use cometd instances if shareConnection is not set', function () {
                var manager1 = new Manager({ shareConnection: false });
                var manager2 = new Manager({ shareConnection: false });

                (manager1.cometd.i).should.not.equal(manager2.cometd.i);
            });
        });
        describe('#getChannel', function () {
            it('should take in a string channel', function () {
                //TODO: Find a better mocking solution so I don't have to recreate Channel
            });
        });
    });
}());
