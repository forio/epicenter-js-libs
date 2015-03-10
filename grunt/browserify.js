'use strict';

var minifyify = require('minifyify');
var istanbul = require('browserify-istanbul');

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-browserify');
    grunt.config.set('browserify', {
        options: {
            browserifyOptions: {
                debug: true
            },
            postBundleCB: function (err, buffer, next) {
                var code = grunt.template.process(buffer.toString(), { data: grunt.file.readJSON('package.json') });
                next(err, code);
            }
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
        instrumented: {
            files: {
                './dist/epicenter-edge-instrumented.js': './src/app.js'
            },
            options: {
                transform: [istanbul],
                debug: false
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
                            mangle: false,
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
