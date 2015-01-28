
var classFrom = require('../../util/inherit');
var Base = {};

// Interface that all strategies need to implement
module.exports = classFrom(Base, {
    reset: function () {
        // return a newly created run
    },

    getRun: function () {
        // return a usable run
    }
});
