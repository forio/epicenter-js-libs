module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')
    });

    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-markdox');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jscs-checker');


    grunt.loadNpmTasks('grunt-browserify');

    grunt.config.set('browserify', {
        options: {
            // external: ['jquery'],
            browserifyOptions: {
                // bundleExternal: true,
                debug: true,
            }
        },
        min: {
            options: {
            },
            src: './src/app.js',
            dest: './dist/epicenter.min.js',
        }

        // tests: {
        //     options: {

        //         entry: './tests/test-list.js',
        //         compile: './tests/tests-browserify-bundle.js',
        //         debug: true
        //     }
        // },
        // edge: {
        //     options: {
        //         debug: true,
        //         compile: './dist/flow-edge.js'
        //     }
        // },
        // mapped: {
        //     options: {
        //         debug: true,
        //         compile: './dist/flow.js'
        //     },
        //     afterHook: function(src) {
        //         var banner = grunt.file.read('./banner.js');
        //         banner = grunt.template.process(banner, {data: grunt.file.readJSON('package.json')});
        //         return banner + src;
        //     }
        // },
        // min: {
        //     options: {
        //         debug: false,
        //         compile: './dist/epicenter.min.js'
        //     },
        //     afterHook: function(src) {
        //         var result = UglifyJS.minify(src, {
        //             fromString: true,
        //             warnings: true,
        //             mangle: true,
        //             compress:{
        //                 pure_funcs: [ 'console.log' ]
        //             }
        //         });
        //         var code = result.code;
        //         // var banner = grunt.file.read('./banner.js');
        //         // banner = grunt.template.process(banner, {data: grunt.file.readJSON('package.json')});
        //         return code;
        //     }
        // }
    });



    grunt.loadNpmTasks('grunt-conventional-changelog');
    grunt.config.set('changelog',{
        options: {
            dest: 'dist/CHANGELOG.md',
            editor: 'sublime -w'
        }
    });

    grunt.config.set('watch', {
        source: {
            files: ['src/**/*.js'],
            tasks: ['mocha:test', 'uglify:production']
        },
        tests: {
            files: ['tests/spec/**/*.js'],
            tasks: ['mocha:test']
        }
    });


    grunt.config.set('jshint', {
        options: {
            jshintrc: true,
            reporter: require('jshint-stylish')
        },
        source: {
            files: {
                src: ['src/**/*.js']
            }
        },
        tests: {
            files: {
                src: ['tests/spec/**/*.js']
            }
        },
        all: {
            files: {
                src: ['src/**/*.js', 'tests/spec/**/*.js']
            },
        }
    });


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
                }
            ]
        }
    });

    grunt.config.set('mocha', {
        test: {
            src: ['tests/index.html'],
            options: {
                run: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-bump');
    grunt.config.set('bump', {
        options: {
            files: ['package.json', 'bower.json'],
            pushTo: 'master',
            updateConfigs: ['pkg'],
            commitFiles: ['-a']

        }
    });

    grunt.registerTask('test', ['mocha']);
    grunt.registerTask('documentation', ['markdox']);
    grunt.registerTask('validate', ['jshint:all', 'test']);
    grunt.registerTask('production', ['validate', 'documentation']);

    grunt.registerTask('release', function (type) {
        //TODO: Integrate 'changelog' in here when it's stable
        type = type ? type : 'patch';
        ['production', 'bump-only:' + type, 'changelog', 'bump-commit'].forEach(function (task) {
            grunt.task.run(task);
        });
    });

    grunt.registerTask('default', ['watch']);
};
