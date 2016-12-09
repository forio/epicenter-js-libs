'use strict';
module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-uglify');
    var files = [
        '../node_modules/cometd-jquery/org/cometd.js', 
        '../node_modules/cometd-jquery/org/cometd/AckExtension.js', 
        '../node_modules/cometd-jquery/org/cometd/ReloadExtension.js', 
        '../node_modules/cometd-jquery/org/cometd/TimeSyncExtension.js', 
        '../node_modules/cometd-jquery/jquery/jquery.cometd.js',
        '../node_modules/cometd-jquery/jquery/jquery.cometd-ack.js',
        '../node_modules/cometd-jquery/jquery/jquery.cometd-reload.js',
        '../node_modules/cometd-jquery/jquery/jquery.cometd-timesync.js',
    ];
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
