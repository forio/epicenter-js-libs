'use strict';

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-template-module');

    grunt.config.set('template-module', {
        compile: {
            options: {
                module: true,
                provider: 'lodash',
                requireProvider: false,
                processName: function (filename) {
                    return filename
                        .replace(/.*\/templates\//i, '')
                        .replace('.html', '')
                        .toLowerCase();
                }
            },
            files: {
                'src/components/assignment/js/templates.js': [
                    'src/components/assignment/templates/**/*.html'
                ]
            }
        }
    });

    grunt.registerTask('templates', [
        'template-module:compile'
    ]);
};
