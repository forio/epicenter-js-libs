'use strict';
module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.config.set('copy', {
        components: {
            files: [{
                cwd: './src/components',
                expand: true,
                src: ['**/*', '!**/*.js'],
                dest: './dist/components'
            }]
        }
    });
};