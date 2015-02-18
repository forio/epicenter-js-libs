'use strict';
var istanbul = require('istanbul');
var fs = require('fs');

module.exports = function (grunt) {
    grunt.registerTask('instrument', 'using isntanbul to instrument sourcefile', function () {
        var instrumenter = new istanbul.Instrumenter();
        var file = fs.readFileSync('./dist/epicenter-edge.js', 'utf8');
        instrumenter.instrument(file, './dist/epicenter-edge.js',
            function (err, code) {
                fs.writeFileSync('./dist/epicenter-edge-instrument.js', code);
            });
    });
};
