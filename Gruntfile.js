module.exports = function (grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-markdox');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jscs-checker');

    grunt.initConfig({
        watch: {
            source: {
                files: ['src/**/*.js'],
                tasks: ['mocha:test', 'uglify:production']
            },
            tests: {
                files: ['tests/spec/**/*.js'],
                tasks: ['mocha:test']
            }
        },
        jshint : {
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
                }
            }
        },
        uglify: {
            options: {
                compress: false,
                sourceMap: false,
                sourceMapIncludeSources: false
            },
            dev: {
                files: []
            },
            production: {
                options: {
                    compress: true,
                    sourceMap: true,
                    sourceMapIncludeSources: true
                },
                files: {
                    'dist/epicenter.min.js' : [
                        'src/util/query-util.js',
                        'src/util/run-util.js',

                        'src/service/url-config-service.js',
                        'src/service/configuration-service.js',

                        'src/transport/ajax-http-transport.js',
                        'src/transport/http-transport-factory.js',

                        'src/store/cookie-store.js',
                        'src/store/store-factory.js',
                        'src/service/data-api-service.js',


                        'src/service/auth-api-service.js',
                        'src/service/variables-api-service.js',
                        'src/service/run-api-service.js'
                    ]
                }
            }
        },
        markdox: {
            options: {
                // Task-specific options go here.
                template: 'documentation/template.ejs'
            },
            target: {
                files:  [
                    // {
                    //     src: 'src/service/configuration-service.js', dest: 'documentation/generated/configuration-service.html.md'
                    // },
                    {
                        src: 'src/service/run-api-service.js',
                        dest: 'documentation/generated/run-api-service.html.md'
                    },
                    {
                        src: 'src/service/data-api-service.js',
                        dest: 'documentation/generated/data-api-service.html.md'
                    },
                    {
                        src: 'src/service/auth-api-service.js',
                        dest: 'documentation/generated/auth-api-service.html.md'
                    },
                    {
                        src: 'src/service/variables-api-service.js',
                        dest: 'documentation/generated/variables-api-service.html.md'
                    }
                ]
            }
        },
        mocha: {
            test: {
                src: ['tests/index.html'],
                options: {
                    run: true
                }
            }
        }
    });

    grunt.registerTask('test', ['mocha']);
    grunt.registerTask('documentation', ['markdox']);
    grunt.registerTask('validate', ['jshint:all', 'test']);
    grunt.registerTask('production', [ 'validate', 'uglify:production', 'documentation']);
    grunt.registerTask('default', ['watch']);

};
