'use strict';

var minifyify = require('minifyify');

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-browserify');
    grunt.config.set('browserify', {
        options: {
            browserifyOptions: {
                debug: true
            },
            banner: grunt.file.read('./banner.js')
        },
        mapped: {
            files: {
                './dist/epicenter.js': './src/app.js'
            }
        },
        edge: {
            files: {
                './dist/epicenter-edge.js': './src/app.js'
            }
        },
        min: {
            files: {
                './dist/epicenter.min.js': './src/app.js'
            },
            options: {
                preBundleCB: function (b) {
                    b.plugin(minifyify, {
                        map: 'epicenter.min.js.map',
                        output: 'dist/epicenter.min.js.map',
                        uglify: {
                            mangle: true,
                            warnings: true,
                            compress:{
                                screw_ie8: true,
                                drop_console: true,
                                pure_funcs: [ 'console.log' ],
                            }
                        }
                    });
                }
            }
        }
    });
};
