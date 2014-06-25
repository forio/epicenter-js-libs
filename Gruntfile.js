module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-markdox');
    grunt.loadNpmTasks('grunt-contrib-watch');

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

                        'src/persistence/cookie-persistence-service.js',
                        'src/persistence/data-api-persistence-service.js',
                        'src/persistence/persistence-service-factory.js',


                        'src/service/auth-api-service.js',
                        'src/service/variables-api-service.js',
                        'src/service/run-api-service.js',
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
                        src: 'src/service/run-api-service.js', dest: 'documentation/generated/run-api-service.html.md'
                    },
                    {
                        src: 'src/persistence/data-api-persistence-service.js', dest: 'documentation/generated/data-api-persistence-service.html.md'
                    },
                    {
                        src: 'src/service/auth-api-service.js', dest: 'documentation/generated/auth-api-service.html.md'
                    },
                    {
                        src: 'src/service/variable-api-service.js', dest: 'documentation/generated/variable-api-service.html.md'
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
          },
        }
    });

    grunt.registerTask('default', ['watch']);
    grunt.registerTask('documentation', ['markdox']);

};
