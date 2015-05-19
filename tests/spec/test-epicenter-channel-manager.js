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
            //TODO: Find a better mocking solution so I don't have to recreate Channel
        });


    });
}());
