var cm = new ChannelManager();
cm.on('connect', function (){ });
cm.on('disconnect', function (){ });

var wm = new WorldManager();
wm.getCurrentWorld(function (world) {

    var worldChannel = cm.getWorldChannel(world.id);
    worldChannel.subscribe("runEvents", fn);

    var usersChannel = cm.getUsersChannel(world.users);

})

wm.getCurrentRun().then(function (run) {

    var rs = new RunService(run.id);

    var runChannel = cm.getRunChannel(rs);
    runChannel.subscribe("completed", fn);

    var variablesChannel = cm
})

var runChannel = cm.getChannel(rs);
runChannel.subscribe("completed", fn);

runChannel.subscribe("variables/price", fn);
runChannel.subscribe("variables/*", fn);

runChannel.subscribe("operations/add", fn);
runChannel.subscribe("operations/*", fn);

runChannel.subscribe("*", fn); //updates on top-level items
runChannel.subscribe("**", fn); //updates on all items

runChannel.subscribe(fn);

runChannel.publish({completed: true}); //alias for rs.save()
runChannel.publish("variables/price", 10); //alias for rs.variables().save()
runChannel.publish("operations/add", [10,10]); //alias for rs.do();

var variablesChannel = cm.getChannel(rs.variables())
variablesChannel.subscribe("price");
variablesChannel.publish("price", 20); //alias for rs.variables.save();

var invoicesChannel = cm.getChannel('invoices');
invoicesChannel.publish({msg: "Hey all, I just published an invoice", data: {invoiceID: 1}});
invoicesChannel.subscribe(function (evt, data) {
    console.log(data.originator, data.payload);
});


var worldChannel = cm.getWorldChannel();
worldChannel.subscribe("randomTopic")
worldChannel.subscribe("run/*")
worldChannel.subscribe("run/variables/*")
worldChannel.subscribe("run/operations/*")

var groupChannel = cm.getGroupChannel("randomTopic");

cm.getChannel("randomTopic", {scope: "world"});
cm.getChannel("randomTopic", {scope: "group"});


** EPI Bugs

Cannot publish to top-level group channel
Publishing to /project/team-naren/multiplayer-test/default-feb-2015/something works - I can publish without errors and all subscribers are notified
Publishing to /project/team-naren/multiplayer-test/default-feb-2015/ does not work - I can publish but no subscribers are notified

