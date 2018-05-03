'use strict';

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.config.set('watch', {
        source: {
            files: ['src/**/*.js', '!src/**/test-*.js'],
            tasks: ['webpack:edge', 'karma:testList']
        },
        tests: {
            options: {
                interrupt: true,
                spawn: false
            },
            files: ['src/**/test-*.js'],
            tasks: []
        },
        components: {
            files: ['src/components/**/*', '!src/components/**/*.js'],
            tasks: ['copy:components']
        },
        templates: {
            files: ['src/components/**/templates/**/*.html'],
            tasks: ['templates']
        }
    });

    var dependencies = grunt.config.get('karma.singleTest.files'); // keep the original files array
    function handleSpecFileChanged(filepath) {
        var testFilePath = './' + filepath.replace(/\\/g, '/');
        grunt.log.writeln(['Running single karma test for: ' + testFilePath]);
        var updatedFiles = dependencies.concat([{ src: filepath, 
            watched: false,
            included: true,
            served: true, 
        }]);
        grunt.config.set('karma.singleTest.files', updatedFiles);

        var pp = {};
        pp[testFilePath] = ['webpack'];

        grunt.config.set('karma.singleTest.options.preprocessors', pp);
        grunt.task.run('karma:singleTest:start');
    }

    grunt.event.on('watch', function watchEventListener(action, filepath, target) {
        if (target === 'tests' && action !== 'deleted') {
            handleSpecFileChanged(filepath);
        }
    });
};
