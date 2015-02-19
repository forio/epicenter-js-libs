'use strict';
module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-uglify');
    var BASE_COMETD_PATH = 'vendor/cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/';
    var COMETD_PLUGINS_PATH = 'vendor/cometd-jquery/cometd-javascript/jquery/src/main/webapp/jquery';
    var files = [
        BASE_COMETD_PATH + '/cometd-header.js',
        BASE_COMETD_PATH + '/cometd-namespace.js',
        BASE_COMETD_PATH + '/cometd-json.js',
        BASE_COMETD_PATH + '/Utils.js',
        BASE_COMETD_PATH + '/TransportRegistry.js',
        BASE_COMETD_PATH + '/Transport.js',
        BASE_COMETD_PATH + '/RequestTransport.js',
        BASE_COMETD_PATH + '/LongPollingTransport.js',
        BASE_COMETD_PATH + '/CallbackPollingTransport.js',
        BASE_COMETD_PATH + '/WebSocketTransport.js',
        BASE_COMETD_PATH + '/Cometd.js',
        COMETD_PLUGINS_PATH + '/jquery.cometd.js'
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
                sourceMap: true,
                compress: false,
                warnings: false
            },
            files: {
                'dist/epicenter-multiplayer-dependencies.js': files
            }
        }
    });
};
