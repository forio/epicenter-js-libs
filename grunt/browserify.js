'use strict';

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-browserify');
    grunt.config.set('browserify', {

        mapped: {

        },
        edge: {
            files: {
                './dist/epicenter-edge.js': './src/app.js'
            },
            options: {
                browserifyOptions: {
                    debug: true
                }
            }
        },
        min: {
            files: {
                './dist/epicenter.min.js': './src/app.js'
            }
        }
    });

};
