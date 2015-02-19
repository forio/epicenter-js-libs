'use strict';
module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-mocha-phantom-istanbul');
    grunt.config.set('mocha', {
        options: {
            run: true,
            growlOnSuccess: false,
            reporter: 'Min'
        },
        coverage: {
            src: ['tests/index.html'],
            options: {
                coverage: {
                    coverageFile: 'coverage/coverage.json'
                }
            }
        },
        test: {
            src: ['tests/index.html']
        }
    });
};
