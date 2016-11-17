'use strict';

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-eslint');
    grunt.config.set('eslint', {
        src: ['src/*.js', 'src/**/*.js', 'tests/spec/*.js', 'tests/spec/**/*.js', '!src/**/templates.js']
    });
};
