'use strict';
module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-mocha-phantom-istanbul');
    grunt.config.set('mocha', {
        test: {
            src: ['tests/index.html'],
            options: {
                run: true,
                growlOnSuccess: false,
                reporter: 'Min',
                coverage: {
                    coverageFile: 'coverage.json'
                }
            }
        }
    });
};
