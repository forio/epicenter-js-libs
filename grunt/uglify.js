'use strict';
module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-uglify');
    var files = ['../node_modules/cometd-jquery/org/cometd.js', '../node_modules/cometd-jquery/jquery/jquery.cometd.js'];
    grunt.config.set('uglify', {
        options: {
            sourceMap: true,
            warnings: false
        },
        cometdMin: {
            options: {
                compress: {
                    drop_console: true
                },
            },
            files: {
                'dist/epicenter-multiplayer-dependencies.min.js': files
            }
        },
        cometdDebug: {
            options: {
                sourceMap: false,
                mangle: false,
                compress: false,
                warnings: false
            },
            files: {
                'dist/epicenter-multiplayer-dependencies.js': files
            }
        }
    });
};
