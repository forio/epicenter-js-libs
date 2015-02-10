'use strict';

$(function () {
   var cm = new F.manager.Channel({ server: { host: 'api.forio.com' } });
   cm.on('connect', function () {
       $('#status').html('connected');
   });
   cm.on('disconnect', function () {
       $('#status').html('disconnected');
   });
});
