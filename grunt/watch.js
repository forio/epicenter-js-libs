'use strict';

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.config.set('watch', {
        source: {
            files: ['src/**/*.js'],
            tasks: ['browserify:edge', 'mocha:test']
        },
        tests: {
            files: ['tests/spec/**/*.js'],
            tasks: ['mocha:test']
        }
    });
};
