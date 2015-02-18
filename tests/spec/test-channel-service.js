(function () {
    'use strict';

    var Channel = F.service.Channel;

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
                mockCometd.subscribe.should.have.been.calledWith('topic', $.noop);
            });
            it('can be over-ridden with custom functions to subscribe', function () {
                var c = new Channel({
                    transport: mockCometd,
                    topicResolver: function (topic) {
                        return topic.split('').reverse().join('');
                    }
                });
                c.subscribe('topic', $.noop);
                mockCometd.subscribe.should.have.been.calledWith('cipot', $.noop);
            });

            it('can be over-ridden with custom functions to subscribe', function () {
                var c = new Channel({
                    transport: mockCometd,
                    topicResolver: function (topic) {
                        return topic.split('').reverse().join('');
                    }
                });
                c.publish('topic', { a:1 });
                mockCometd.publish.should.have.been.calledWith('cipot', { a:1 });
            });
        });

        describe('#subscribe', function () {
            it('should pass on string topics', function () {
                c.subscribe('topic', $.noop);

                mockCometd.subscribe.should.have.been.calledOnce;
                mockCometd.subscribe.should.have.been.calledWith('topic', $.noop);
            });

            it('should pass on array topics', function () {
                c.subscribe(['topic1', 'topic2', 'topic3'], $.noop);

                mockCometd.subscribe.should.have.been.calledThrice;
                // mockCometd.subscribe.should.have.been.calledWith('/topic', $.noop);
            });


        });

        describe('makeName', function () {
            it('should not have trailing slashes while subscribing', function () {
                c.subscribe('topic/', $.noop);
                mockCometd.subscribe.should.have.been.calledWith('topic', $.noop);
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
}());
