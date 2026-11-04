
import Manager from '../index';
import ChannelManager from '../channel-manager';
import URLService from 'service/url-config-service';

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
        ChannelManager.prototype._cometd = null;
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

    describe('#channelProtocol', function () {
        var oldDefaults;
        beforeEach(function () {
            oldDefaults = $.extend({}, URLService.defaults);
        });
        afterEach(function () {
            URLService.defaults = oldDefaults;
        });
        it('should connect to the cometd endpoint by default', function () {
            var manager = new Manager({ userId: 'userId', token: 'token' });
            manager.options.url.should.match(/\/channel\/subscribe\/$/);
        });
        it('should connect to the oumuamua endpoint when channelProtocol is oumuamua', function () {
            var manager = new Manager({ userId: 'userId', token: 'token', channelProtocol: 'oumuamua' });
            manager.options.url.should.match(/\/oumuamua\/subscribe\/$/);
        });
        it('should honor channelProtocol passed through the server options', function () {
            var manager = new Manager({ userId: 'userId', token: 'token', server: { channelProtocol: 'oumuamua' } });
            manager.options.url.should.match(/\/oumuamua\/subscribe\/$/);
        });
        it('should honor a globally configured channelProtocol', function () {
            URLService.defaults = $.extend({}, oldDefaults, { channelProtocol: 'oumuamua' });
            var manager = new Manager({ userId: 'userId', token: 'token' });
            manager.options.url.should.match(/\/oumuamua\/subscribe\/$/);
        });
        it('should leave an explicit url untouched', function () {
            var manager = new Manager({ userId: 'userId', token: 'token', url: 'wss://custom/push', channelProtocol: 'oumuamua' });
            manager.options.url.should.equal('wss://custom/push');
        });
    });

    describe('#channelProtocol auto-detection', function () {
        var account = 'myaccount';
        var token = 'mytoken';
        var oldDefaults;
        var server;
        var cometd;
        var projectCounter = 0;
        var nextProject = function () {
            projectCounter++;
            return 'detect-project-' + projectCounter;
        };
        var lookupURL = function (project) {
            return new URLService({ accountPath: account, projectPath: project }).getAPIPath('project') + 'channel';
        };
        var richMockCometd = function () {
            return {
                addListener: sinon.spy(),
                batch: function (fn) { fn(); },
                configure: sinon.spy(),
                resubscribe: sinon.spy(),
                handshake: sinon.spy(),
                subscribe: sinon.spy(function (channel) { return { channel: channel, id: 0 }; }),
                publish: sinon.spy(),
                unsubscribe: sinon.spy(),
            };
        };
        var createManager = function (project, options) {
            return new Manager($.extend({ account: account, project: project, token: token }, options));
        };
        var respondWithProtocol = function (project, protocol) {
            server.respondWith('GET', lookupURL(project), [200, { 'Content-Type': 'application/json' }, JSON.stringify({ channelProtocol: protocol })]);
        };

        beforeEach(function () {
            oldDefaults = $.extend({}, URLService.defaults);
            server = sinon.fakeServer.create();
            cometd = richMockCometd();
            $.cometd = cometd;
            $.CometD = richMockCometd;
        });
        afterEach(function () {
            URLService.defaults = oldDefaults;
            server.restore();
            $.cometd = mockCometd();
            $.CometD = mockCometd;
        });

        it('should ask the project for its channel protocol with the session token', function () {
            var project = nextProject();
            createManager(project);

            server.requests.length.should.equal(1);
            var req = server.requests[0];
            req.method.toUpperCase().should.equal('GET');
            req.url.should.equal(lookupURL(project));
            req.requestHeaders.Authorization.should.equal('Bearer ' + token);
        });
        it('should connect to the oumuamua endpoint when the project uses oumuamua', function () {
            var project = nextProject();
            respondWithProtocol(project, 'oumuamua');
            var manager = createManager(project);

            cometd.handshake.should.not.have.been.called;
            server.respond();
            return manager._connectionReady.then(function () {
                cometd.configure.should.have.been.calledWith(sinon.match({ url: sinon.match(/\/oumuamua\/subscribe\/$/) }));
                cometd.handshake.should.have.been.calledOnce;
                manager.options.url.should.match(/\/oumuamua\/subscribe\/$/);
            });
        });
        it('should connect to the cometd endpoint when the project uses cometd', function () {
            var project = nextProject();
            respondWithProtocol(project, 'cometd');
            var manager = createManager(project);

            server.respond();
            return manager._connectionReady.then(function () {
                cometd.handshake.should.have.been.calledOnce;
                manager.options.url.should.match(/\/channel\/subscribe\/$/);
            });
        });
        it('should not look up the protocol when channelProtocol is passed in', function () {
            var manager1 = createManager(nextProject(), { channelProtocol: 'cometd', shareConnection: false });
            var manager2 = createManager(nextProject(), { channelProtocol: 'oumuamua', shareConnection: false });

            server.requests.length.should.equal(0);
            manager1.cometd.handshake.should.have.been.calledOnce;
            manager1.options.url.should.match(/\/channel\/subscribe\/$/);
            manager2.cometd.handshake.should.have.been.calledOnce;
            manager2.options.url.should.match(/\/oumuamua\/subscribe\/$/);
        });
        it('should not look up the protocol when channelProtocol is passed through the server options', function () {
            var manager = createManager(nextProject(), { server: { channelProtocol: 'oumuamua' } });

            server.requests.length.should.equal(0);
            cometd.handshake.should.have.been.calledOnce;
            manager.options.url.should.match(/\/oumuamua\/subscribe\/$/);
        });
        it('should not look up the protocol when channelProtocol is configured globally', function () {
            URLService.defaults = $.extend({}, oldDefaults, { channelProtocol: 'cometd' });
            var manager = createManager(nextProject());

            server.requests.length.should.equal(0);
            cometd.handshake.should.have.been.calledOnce;
            manager.options.url.should.match(/\/channel\/subscribe\/$/);
        });
        it('should not look up the protocol when an explicit url is passed in', function () {
            var manager = createManager(nextProject(), { url: 'wss://custom/push' });

            server.requests.length.should.equal(0);
            cometd.handshake.should.have.been.calledOnce;
            manager.options.url.should.equal('wss://custom/push');
        });
        it('should not look up the protocol without a token', function () {
            new Manager({ account: account, project: nextProject() });

            server.requests.length.should.equal(0);
            cometd.handshake.should.have.been.calledOnce;
        });

        describe('fallback', function () {
            var expectCometdFallback = function (project, status, body) {
                server.respondWith('GET', lookupURL(project), [status, { 'Content-Type': 'application/json' }, body]);
                var manager = createManager(project);
                server.respond();
                return manager._connectionReady.then(function () {
                    cometd.handshake.should.have.been.calledOnce;
                    manager.options.url.should.match(/\/channel\/subscribe\/$/);
                });
            };
            it('should connect over cometd when the lookup is unauthorized', function () {
                return expectCometdFallback(nextProject(), 401, '');
            });
            it('should connect over cometd when the server does not have the lookup', function () {
                return expectCometdFallback(nextProject(), 404, '');
            });
            it('should connect over cometd when the lookup method is not allowed', function () {
                return expectCometdFallback(nextProject(), 405, '');
            });
            it('should connect over cometd when the response is not understood', function () {
                return expectCometdFallback(nextProject(), 200, JSON.stringify({ foo: 1 }));
            });
        });

        it('should look up the protocol once per project', function () {
            var project = nextProject();
            respondWithProtocol(project, 'oumuamua');
            var manager1 = createManager(project, { shareConnection: false });
            var manager2 = createManager(project, { shareConnection: false });

            server.requests.length.should.equal(1);
            server.respond();
            return $.when(manager1._connectionReady, manager2._connectionReady).then(function () {
                server.requests.length.should.equal(1);
                manager1.options.url.should.match(/\/oumuamua\/subscribe\/$/);
                manager2.options.url.should.match(/\/oumuamua\/subscribe\/$/);
            });
        });
        it('should hold subscriptions made before the protocol is known until the connection opens', function () {
            var project = nextProject();
            respondWithProtocol(project, 'oumuamua');
            var manager = createManager(project);
            var channel = manager.getDataChannel('coll');
            var subscription = channel.subscribe('', $.noop);
            channel.publish('', { a: 1 });

            cometd.subscribe.should.not.have.been.called;
            cometd.publish.should.not.have.been.called;
            server.respond();
            return manager._connectionReady.then(function () {
                cometd.handshake.should.have.been.calledOnce;
                cometd.subscribe.should.have.been.calledOnce;
                cometd.subscribe.should.have.been.calledAfter(cometd.handshake);
                cometd.publish.should.have.been.calledAfter(cometd.subscribe);
                cometd.publish.should.have.been.calledWith('/data/' + account + '/' + project + '/coll', { a: 1 });
                subscription.channel.should.equal('/data/' + account + '/' + project + '/coll');
                manager.currentSubscriptions.should.include(subscription);
            });
        });
        it('should only drop the unsubscribed subscription when unsubscribing before the connection opens', function () {
            var project = nextProject();
            respondWithProtocol(project, 'oumuamua');
            var manager = createManager(project);
            var channel = manager.getDataChannel('coll');
            var first = channel.subscribe('a', $.noop);
            var second = channel.subscribe('b', $.noop);
            var third = channel.subscribe('c', $.noop);
            channel.unsubscribe(second);

            manager.currentSubscriptions.length.should.equal(2);
            manager.currentSubscriptions[0].should.equal(first);
            manager.currentSubscriptions[1].should.equal(third);
            cometd.unsubscribe.should.not.have.been.called;
            server.respond();
            return manager._connectionReady.then(function () {
                cometd.subscribe.should.have.been.calledThrice;
                cometd.unsubscribe.should.have.been.calledOnce;
                cometd.unsubscribe.should.have.been.calledAfter(cometd.handshake);
                cometd.unsubscribe.should.have.been.calledAfter(cometd.subscribe);
                cometd.unsubscribe.should.have.been.calledWith(second);
                second.channel.should.equal('/data/' + account + '/' + project + '/coll/b');

                var handshakeListener = cometd.addListener.args.filter(function (args) {
                    return args[0] === '/meta/handshake';
                })[0][1];
                handshakeListener({ successful: true });
                cometd.resubscribe.should.have.been.calledTwice;
                cometd.resubscribe.should.have.been.calledWith(first);
                cometd.resubscribe.should.have.been.calledWith(third);
                cometd.resubscribe.should.not.have.been.calledWith(second);
            });
        });
        it('should send subscriptions straight through once the connection is open', function () {
            var project = nextProject();
            respondWithProtocol(project, 'oumuamua');
            var manager = createManager(project);

            server.respond();
            return manager._connectionReady.then(function () {
                manager.getDataChannel('coll').subscribe('', $.noop);
                cometd.subscribe.should.have.been.calledOnce;
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
