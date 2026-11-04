import Channel from '../index';
import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

describe('Channel', function () {
    var c, mockCometd;
    beforeEach(function () {
        mockCometd = {
            subscribe: sinon.spy(function () {
                // console.log(arguments);
            }),
            publish: sinon.spy(),
            batch: function (cb) {
                cb();
            },
            unsubscribe: sinon.spy()
        };
        c = new Channel({
            transport: mockCometd
        });
    });

    describe('topicResolver', function () {
        it('should default to echo-ing topics', function () {
            c.subscribe('topic', $.noop);
            mockCometd.subscribe.should.have.been.calledWith('topic', sinon.match.func);
        });
        it('can be over-ridden with custom functions to subscribe', function () {
            var c = new Channel({
                transport: mockCometd,
                topicResolver: function (topic) {
                    return topic.split('').reverse().join('');
                }
            });
            c.subscribe('topic', $.noop);
            mockCometd.subscribe.should.have.been.calledWith('cipot', sinon.match.func);
        });

        it('can be over-ridden with custom functions to subscribe', function () {
            var c = new Channel({
                transport: mockCometd,
                topicResolver: function (topic) {
                    return topic.split('').reverse().join('');
                }
            });
            c.publish('topic', { a: 1 });
            mockCometd.publish.should.have.been.calledWith('cipot', { a: 1 });
        });
    });

    describe('#subscribe', function () {
        it('should pass on string topics', function () {
            c.subscribe('topic', $.noop);

            mockCometd.subscribe.should.have.been.calledOnce;
            mockCometd.subscribe.should.have.been.calledWith('topic', sinon.match.func);
        });

        it('should pass on array topics', function () {
            c.subscribe(['topic1', 'topic2', 'topic3'], $.noop);

            mockCometd.subscribe.should.have.been.calledThrice;
            // mockCometd.subscribe.should.have.been.calledWith('/topic', $.noop);
        });

        describe('message delivery', function () {
            var deliver = function (message) {
                var listener = mockCometd.subscribe.firstCall.args[1];
                return listener(message);
            };

            it('should pass cometd messages through unchanged', function () {
                var callback = sinon.spy();
                var message = { channel: '/data/acme/game/messages', data: { type: 'data', subType: 'new', data: { body: 'hi' } } };
                c.subscribe('topic', callback);

                deliver(message);
                callback.should.have.been.calledOnce;
                callback.firstCall.args[0].should.equal(message);
            });

            it('should unwrap the oumuamua legacy envelope so callbacks see the bare v2 message', function () {
                var callback = sinon.spy();
                var inner = { type: 'data', subType: 'new', data: { body: 'hi' } };
                var message = {
                    channel: '/data/acme/game/messages',
                    data: { type: 'legacy', content: inner, address: { path: '/data/acme/game/messages' }, sender: { type: 'USER' } }
                };
                c.subscribe('topic', callback);

                deliver(message);
                callback.should.have.been.calledOnce;
                callback.firstCall.args[0].data.should.equal(inner);
                callback.firstCall.args[0].channel.should.equal(message.channel);
                message.data.type.should.equal('legacy');
            });

            it('should not unwrap messages whose type is legacy but carry no content', function () {
                var callback = sinon.spy();
                var message = { channel: '/data/acme/game/messages', data: { type: 'legacy', foo: 1 } };
                c.subscribe('topic', callback);

                deliver(message);
                callback.firstCall.args[0].should.equal(message);
            });
        });


    });

    describe('makeName', function () {
        it('should not have trailing slashes while subscribing', function () {
            c.subscribe('topic/', $.noop);
            mockCometd.subscribe.should.have.been.calledWith('topic', sinon.match.func);
        });
        it('should not have wildcards in topics while publishing', function () {
            c.publish('topic/*', $.noop);
            mockCometd.publish.should.have.been.calledWith('topic/', $.noop);
        });
    });

    describe('#publish', function () {
        it('should pass on string topics', function () {
            c.publish('topic', { a: 1 });

            mockCometd.publish.should.have.been.calledOnce;
            mockCometd.publish.should.have.been.calledWith('topic', { a: 1 });
        });

        it('should pass on array topics', function () {
            c.publish(['topic1', 'topic2', 'topic3'], { a: 1 });

            mockCometd.publish.should.have.been.calledThrice;
            // mockCometd.subscribe.should.have.been.calledWith('/topic', $.noop);
        });
    });
});
