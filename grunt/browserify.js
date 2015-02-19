'use strict';

var minifyify = require('minifyify');

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-browserify');
    grunt.config.set('browserify', {

        mapped: {
            files: {
                './dist/epicenter.js': './src/app.js'
            },
            options: {
                browserifyOptions: {
                    debug: true
                },
                preBundleCB: function (b) {
                    b.plugin(minifyify, {
                        map: 'epicenter.js.map',
                        output: 'dist/epicenter.js.map',
                        uglify: {
                            mangle: true,
                            compress: true,
                            beautify: false
                        }
                    });
                }
            }
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
