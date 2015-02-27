'use strict';

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-jscs');
    grunt.config.set('jscs', {
        src: ['src/*.js', 'src/**/*.js', 'tests/spec/*.js', 'tests/spec/**/*.js', '!src/**/templates.js']
    });
};
