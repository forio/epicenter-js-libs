module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')
    });

    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-markdox');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jscs-checker');


    grunt.loadNpmTasks('grunt-browserify');
    var UglifyJS = require('uglify-js');

    grunt.config.set('browserify', {
        options: {
            external: ['jquery'],
            browserifyOptions: {
                bundleExternal: false,
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

    grunt.config.set('uglify', {
        options: {
            compress: false,
            sourceMap: false,
            mangle:false,
            sourceMapIncludeSources: false
        },
        dev: {
            files: []
        },
        unminified: {
            options: {
                compress: false,
                mangle: false,
                sourceMap: false,
                beautify: true
            },
            files: {
                'dist/epicenter.js': [
                    'src/util/query-util.js',
                    'src/util/run-util.js',
                    'src/util/inherit.js',
                    'src/util/make-sequence.js',

                    'src/service/url-config-service.js',
                    'src/service/configuration-service.js',

                    'src/transport/ajax-http-transport.js',
                    'src/transport/http-transport-factory.js',

                    'src/store/cookie-store.js',
                    'src/store/store-factory.js',
                    'src/service/data-api-service.js',


                    'src/service/auth-api-service.js',
                    'src/service/variables-api-service.js',
                    'src/service/run-api-service.js',

                    'src/managers/run-strategies/identity-strategy.js',
                    'src/managers/run-strategies/conditional-creation-strategy.js',
                    'src/managers/run-strategies/**/*.js',
                    'src/managers/run-manager.js',
                    'src/managers/scenario-manager.js',
                    'src/managers/**/*.js'
                ]
            }
        },
        production: {
            options: {
                compress: true,
                sourceMap: true,
                sourceMapIncludeSources: true
            },
            files: {
                'dist/epicenter.min.js': [
                    'src/util/query-util.js',
                    'src/util/run-util.js',
                    'src/util/inherit.js',
                    'src/util/make-sequence.js',

                    'src/service/url-config-service.js',
                    'src/service/configuration-service.js',

                    'src/transport/ajax-http-transport.js',
                    'src/transport/http-transport-factory.js',

                    'src/store/cookie-store.js',
                    'src/store/store-factory.js',
                    'src/service/data-api-service.js',


                    'src/service/auth-api-service.js',
                    'src/service/variables-api-service.js',
                    'src/service/run-api-service.js',

                    'src/managers/run-strategies/identity-strategy.js',
                    'src/managers/run-strategies/conditional-creation-strategy.js',
                    'src/managers/run-strategies/**/*.js',
                    'src/managers/run-manager.js',
                    'src/managers/scenario-manager.js',
                    'src/managers/**/*.js'
                ]
            }
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
    grunt.registerTask('production', ['validate', 'uglify:unminified', 'uglify:production', 'documentation']);

    grunt.registerTask('release', function (type) {
        //TODO: Integrate 'changelog' in here when it's stable
        type = type ? type : 'patch';
        ['production', 'bump-only:' + type, 'changelog', 'bump-commit'].forEach(function (task) {
            grunt.task.run(task);
        });
    });

    grunt.registerTask('default', ['watch']);
};
