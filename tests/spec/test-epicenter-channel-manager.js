(function () {
   'use strict';

    var Manager = F.manager.ChannelManager;
    describe('Epicenter ChannelManager', function () {
        var cm;
        var oldCometd;
        var mockCometd = function () {
            return {
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
            cm = new Manager({
                url: 'http://test.com'
            });
        });
        after(function () {
           $.Cometd = oldCometd;
        });

        describe('#getWorldChannel', function () {
            //TODO: Find a better mocking solution so I don't have to recreate Channel
        });
    });
}());
