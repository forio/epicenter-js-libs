'use strict';

var minifyify = require('minifyify');
var istanbul = require('browserify-istanbul');

var babelify = ['babelify', { presets: ['es2015'] }];

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-browserify');
    grunt.config.set('browserify', {
        options: {
            transform: [babelify],
            browserifyOptions: {
                debug: true
            },
            postBundleCB: function (err, buffer, next) {
                var code;
                if (!err) {
                    code = grunt.template.process(buffer.toString(), { data: grunt.file.readJSON('package.json') });
                }
                next(err, code, next);
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
                transform: [babelify, istanbul],
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
                                join_vars: false
                            }
                        }
                    });
                }
            }
        },
        components: {
            files: {
                './dist/components/assignment/assignment.js': './src/components/assignment/js/index.js'
            },
            options: {
                transform: []
            }
        }

    });
};
