
import Manager from '../index';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

describe('Epicenter ChannelManager', function () {
    var oldCometd;
    var oldCometd2;
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

    describe('#handshake', function () {
        it('should send authentication parametes', function () {
            new Manager({ userId: 'userId', token: 'token' });
            handshakeSpy.calledOnce.should.be.true;
            handshakeSpy.getCall(0).args[0].should.be.eql({
                ext: {
                    userId: 'userId',
                    authorization: 'Bearer token'
                }
            });
        });
    });

    describe('#getChannel', function () {
        it('should enforce channel types', function () {
            var cm = new Manager({ userId: 'userId', token: 'token' });
            var ret = function () { cm.getChannel('/test/account/project'); };
            ret.should.throw(Error);
        });
        it('should allow right channel types', function () {
            var cm = new Manager({ userId: 'userId', token: 'token' });
            var ret = function () {
                cm.getChannel('/user/account/project');
                cm.getChannel('/data/account/project');
                cm.getChannel('/project/account/project');
                cm.getChannel('/group/account/project');
                cm.getChannel('/world/account/project');
                cm.getChannel('/general/account/project');
                cm.getChannel('/chat/account/project');
            };
            ret.should.not.throw(Error);
        });
        it('should enforce account and project present', function () {
            var cm = new Manager();
            var ret = function () {
                cm.getChannel('/user/account');
            };
            ret.should.throw(Error);
        });
        it('should not validate when the allowAllChannels is passed in the constructor', function () {
            var cm = new Manager({ allowAllChannels: true });
            var ret = function () {
                cm.getChannel('/anyChannel');
            };
            ret.should.not.throw(Error);
        });
        it('should not validate when the allowAllChannels is passed in the method options', function () {
            var cm = new Manager();
            var ret = function () {
                cm.getChannel({ base: '/anyChannel', allowAllChannels: true });
            };
            ret.should.not.throw(Error);
        });
    });

    describe('#getWorldChannel', function () {
        it('should throw an error if world id not provided', function () {
            var manager = new Manager();
            var ret = function () { manager.getWorldChannel(); };
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
            var ret = function () { manager.getUserChannel(); };
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
            var ret = function () { manager.getDataChannel(); };
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
