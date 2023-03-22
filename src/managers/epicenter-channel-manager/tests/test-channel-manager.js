
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
    describe('#getChannel', function () {
        it('should take in a string channel', function () {
            //TODO: Find a better mocking solution so I don't have to recreate Channel
        });
    });
});
