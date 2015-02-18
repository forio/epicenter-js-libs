'use strict';

var UglifyJS = require('uglify-js');
module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-browserify2');
    grunt.config.set('browserify2', {
        options: {
            debug: true,
            entry: './src/app.js'
        },

        mapped: {
            options: {
                compile: './dist/epicenter.js'
            },
            afterHook: function (src) {
                var banner = grunt.file.read('./banner.js');
                banner = grunt.template.process(banner, { data: grunt.file.readJSON('package.json') });
                return banner + src;
            }
        },
        edge: {
            options: {
                compile: './dist/epicenter-edge.js'
            },
        },
        min: {
            options: {
                debug: false,
                compile: './dist/epicenter.min.js'
            },
            afterHook: function (src) {
                var result = UglifyJS.minify(src, {
                    fromString: true,
                    warnings: true,
                    mangle: true,
                    compress:{
                        pure_funcs: [ 'console.log' ]
                    }
                });
                var code = result.code;
                var banner = grunt.file.read('./banner.js');
                banner = grunt.template.process(banner, { data: grunt.file.readJSON('package.json') });
                return banner + code;
            }
        }
    });
};
