var runChannel = ChannelManager.getChannel(rs);
runChannel.subscribe("completed", fn);

runChannel.subscribe("variables/price", fn);
runChannel.subscribe("variables/*", fn);

runChannel.subscribe("operations/add", fn);
runChannel.subscribe("operations/*", fn);

runChannel.subscribe("*", fn); //updates on top-level items
runChannel.subscribe("*/*", fn); //updates on all items

runChannel.subscribe(fn);

runChannel.publish({completed: true}); //alias for rs.save()
runChannel.publish("variables/price", 10); //alias for rs.variables().save()
runChannel.publish("operations/add", [10,10]); //alias for rs.do();

var variablesChannel = ChannelManager.getChannel(rs.variables())
variablesChannel.subscribe("price");
variablesChannel.publish("price", 20); //alias for rs.variables.save();

var invoicesChannel = ChannelManager.getChannel('invoices');
invoicesChannel.publish({msg: "Hey all, I just published an invoice", data: {invoiceID: 1}});
invoicesChannel.subscribe(function (evt, data) {
    console.log(data.originator, data.payload);
});


var worldChannel = ChannelManager.getWorldChannel();
worldChannel.subscribe("randomTopic")
worldChannel.subscribe("run/*")
worldChannel.subscribe("run/variables/*")
worldChannel.subscribe("run/operations/*")

var groupChannel = ChannelManager.getGroupChannel("randomTopic");

ChannelManager.getChannel("randomTopic", {scope: "world"});
ChannelManager.getChannel("randomTopic", {scope: "group"});
