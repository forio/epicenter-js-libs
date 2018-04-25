'use strict';

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-conventional-changelog');
    grunt.config.set('changelog', {
        options: {
            dest: 'dist/CHANGELOG.md',
            editor: 'sublime -w'
        }
    });
};
