'use strict';
module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.config.set('copy', {
        components: {
            files: [{
                cwd: './src/components',
                expand: true,
                src: ['**/*', '!**/*.js', '!*/templates/**/*.*', '!*/js/**/*.*'],
                dest: './dist/components'
            }],
            options: {
                process: function (contents, srcPath) {
                    if (/\.html$/.test(srcPath)) {
                        return grunt.template.process(contents, { data: grunt.file.readJSON('package.json') });
                    }
                }
            }
        }
    });
};