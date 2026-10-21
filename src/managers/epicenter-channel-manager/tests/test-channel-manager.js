
import Manager from '../channel-manager';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

describe('ChannelManager', function () {
    var oldCometd;
    var oldCometd2;
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
        oldCometd = $.CometD;
        oldCometd2 = $.cometd;
        $.cometd = mockCometd();
        $.CometD = mockCometd;
    });
    after(function () {
        $.CometD = oldCometd;
        $.cometd = oldCometd2;
    });
    afterEach(function () {
        Manager.prototype._cometd = null;
    });

    describe('#shareConnection', function () {
        it('should re-use cometd instances by default', function () {
            var manager1 = new Manager({ shareConnection: true, url: 'foobar' });
            var manager2 = new Manager({ shareConnection: true, url: 'foobar' });

            (manager1.cometd.i).should.equal(manager2.cometd.i);
        });
        it('should not re-use cometd instances if shareConnection is not set', function () {
            var manager1 = new Manager({ shareConnection: false, url: 'foobar' });
            var manager2 = new Manager({ shareConnection: false, url: 'foobar' });

            (manager1.cometd.i).should.not.equal(manager2.cometd.i);
        });
    });
    describe('#resolveUrl', function () {
        it('should handshake immediately when no resolveUrl is given', function () {
            var manager = new Manager({ shareConnection: false, url: 'foobar' });

            manager.cometd.handshake.should.have.been.calledOnce;
            manager._connectionReady.state().should.equal('resolved');
        });
        it('should wait for resolveUrl and connect to the resolved url', function () {
            var resolution = $.Deferred();
            var manager = new Manager({ shareConnection: false, url: 'foobar', resolveUrl: function () { return resolution.promise(); } });

            manager.cometd.handshake.should.not.have.been.called;
            manager._connectionReady.state().should.equal('pending');
            resolution.resolve('resolved-url');
            return manager._connectionReady.then(function () {
                manager.cometd.configure.should.have.been.calledWith({ url: 'resolved-url' });
                manager.cometd.handshake.should.have.been.calledOnce;
                manager.options.url.should.equal('resolved-url');
            });
        });
        it('should connect to the original url when resolveUrl fails', function () {
            var resolution = $.Deferred();
            var manager = new Manager({ shareConnection: false, url: 'foobar', resolveUrl: function () { return resolution.promise(); } });

            resolution.reject();
            return manager._connectionReady.then(function () {
                manager.cometd.handshake.should.have.been.calledOnce;
                manager.options.url.should.equal('foobar');
            });
        });
        it('should share the pending connection with later managers', function () {
            var resolution = $.Deferred();
            var handshakesBefore = $.cometd.handshake.callCount;
            var manager1 = new Manager({ shareConnection: true, url: 'foobar', resolveUrl: function () { return resolution.promise(); } });
            var manager2 = new Manager({ shareConnection: true, url: 'foobar' });

            manager2._connectionReady.should.equal(manager1._connectionReady);
            manager1.cometd.handshake.callCount.should.equal(handshakesBefore);
        });
    });
    describe('#getChannel', function () {
        it('should take in a string channel', function () {
            //TODO: Find a better mocking solution so I don't have to recreate Channel
        });
    });
});
