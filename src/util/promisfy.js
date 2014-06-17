var testFn = function() {

    var publicf = {
        a: function() {
            console.log('a');
            return publicf;
        },
        b: function() {
            console.log('b');
            return publicf;
        }
    };

    return publicf;
};

