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

        describe('#subscribe', function () {
            it('should pass on string topics', function () {
                c.subscribe('topic', $.noop);

                mockCometd.subscribe.should.have.been.calledOnce;
                mockCometd.subscribe.should.have.been.calledWith('/topic', $.noop);
            });

            it('should pass on string topics', function () {
                c.subscribe(['topic1', 'topic2', 'topic3'], $.noop);

                mockCometd.subscribe.should.have.been.calledThrice;
                // mockCometd.subscribe.should.have.been.calledWith('/topic', $.noop);
            });
        });
    });
}());
