'use strict';
module.exports = function (grunt) {
    //using a custom fork of grunt-mocha-phantom-istanbul because the older version does not support newer versions of Mac (Sierra 10.12.1).
    grunt.loadNpmTasks('grunt-mocha-phantom-istanbul-senluchen2015');
    grunt.config.set('mocha', {
        options: {
            run: true,
            growlOnSuccess: false,
            reporter: 'Min',
            // log: true,
            coverage: {
                jsonReport: 'coverage'
            }
        },
        test: {
            src: ['tests/index.html']
        }
    });
};
