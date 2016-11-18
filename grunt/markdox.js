'use strict';

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-markdox');
    grunt.config.set('markdox', {
        options: {
            // Task-specific options go here.
            template: 'documentation/template.ejs'
        },
        target: {
            files: [
                // {
                //     src: 'src/service/configuration-service.js', dest: 'documentation/generated/configuration-service.html.md'
                // },
                {
                    src: 'src/service/run-api-service.js',
                    dest: 'documentation/generated/run-api-service/index.html.md'
                }, {
                    src: 'src/service/data-api-service.js',
                    dest: 'documentation/generated/data-api-service/index.html.md'
                }, {
                    src: 'src/service/auth-api-service.js',
                    dest: 'documentation/generated/auth-api-service/index.html.md'
                }, {
                    src: 'src/service/variables-api-service.js',
                    dest: 'documentation/generated/variables-api-service/index.html.md'
                }, {
                    src: 'src/service/world-api-adapter.js',
                    dest: 'documentation/generated/world-api-adapter/index.html.md'
                }, {
                    src: 'src/service/channel-service.js',
                    dest: 'documentation/generated/channel-service/index.html.md'
                }, {
                    src: 'src/service/introspection-api-service.js',
                    dest: 'documentation/generated/introspection-api-service/index.html.md'
                }, {
                    src: 'src/service/state-api-adapter.js',
                    dest: 'documentation/generated/state-api-adapter/index.html.md'
                }, {
                    src: 'src/service/user-api-adapter.js',
                    dest: 'documentation/generated/user-api-adapter/index.html.md'
                }, {
                    src: 'src/service/member-api-adapter.js',
                    dest: 'documentation/generated/member-api-adapter/index.html.md'
                }, {
                    src: 'src/service/asset-api-adapter.js',
                    dest: 'documentation/generated/asset-api-adapter/index.html.md'
                }, {
                    src: 'src/managers/run-manager.js',
                    dest: 'documentation/generated/run-manager/index.html.md'
                }, {
                    src: 'src/managers/auth-manager.js',
                    dest: 'documentation/generated/auth-manager/index.html.md'
                }, {
                    src: 'src/managers/world-manager.js',
                    dest: 'documentation/generated/world-manager/index.html.md'
                }, {
                    src: 'src/managers/channel-manager.js',
                    dest: 'documentation/generated/channel-manager/index.html.md'
                }, {
                    src: 'src/managers/epicenter-channel-manager.js',
                    dest: 'documentation/generated/epicenter-channel-manager/index.html.md'
                }

            ]
        }
    });
};
