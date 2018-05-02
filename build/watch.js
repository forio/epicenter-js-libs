'use strict';

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.config.set('watch', {
        source: {
            files: ['src/**/*.js'],
            tasks: ['test']
        },
        // tests: {
        //     files: ['tests/spec/**/*.js'],
        //     tasks: ['mocha']
        // },
        components: {
            files: ['src/components/**/*', '!src/components/**/*.js'],
            tasks: ['copy:components']
        },
        templates: {
            files: ['src/components/**/templates/**/*.html'],
            tasks: ['templates']
        }
    });
};
