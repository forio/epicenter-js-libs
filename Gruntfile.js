module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')
    });

    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-markdox');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');


    var UglifyJS = require('uglify-js');
    grunt.loadNpmTasks('grunt-browserify2');
    grunt.config.set('browserify2', {
        options: {
            debug: true,
            entry: './src/app.js'
        },

        mapped: {
            options: {
                compile: './dist/epicenter.js'
            },
            afterHook: function (src) {
                var banner = grunt.file.read('./banner.js');
                banner = grunt.template.process(banner, { data: grunt.file.readJSON('package.json') });
                return banner + src;
            }
        },
        edge: {
            options: {
                compile: './dist/epicenter-edge.js'
            },
        },
        min: {
            options: {
                debug: false,
                compile: './dist/epicenter.min.js'
            },
            afterHook: function (src) {
                var result = UglifyJS.minify(src, {
                    fromString: true,
                    warnings: true,
                    mangle: true,
                    compress:{
                        pure_funcs: [ 'console.log' ]
                    }
                });
                var code = result.code;
                var banner = grunt.file.read('./banner.js');
                banner = grunt.template.process(banner, { data: grunt.file.readJSON('package.json') });
                return banner + code;
            }
        },

        components: {
            options: {
                entry: './src/components/assignment/js/npm.js',
                compile: './dist/components/assignment/assignment.js',
                expose: {
                    'inherit': './src/util/inherit'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-jscs');
    grunt.config.set('jscs', {
        src: ['src/*.js', 'src/**/*.js', 'tests/spec/*.js', 'tests/spec/**/*.js']
    });


    grunt.loadNpmTasks('grunt-conventional-changelog');
    grunt.config.set('changelog',{
        options: {
            dest: 'dist/CHANGELOG.md',
            editor: 'sublime -w'
        }
    });

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

    grunt.config.set('watch', {
        source: {
            files: ['src/**/*.js'],
            tasks: ['browserify2:edge', 'browserify2:components', 'mocha:test']
        },
        components: {
            files: ['src/components/**/*', '!src/components/**/*.js'],
            tasks: ['copy:components']
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
                }, {
                    src: 'src/managers/run-manager.js',
                    dest: 'documentation/generated/run-manager/index.html.md'
                }

            ]
        }
    });

    grunt.config.set('mocha', {
        test: {
            src: ['tests/index.html'],
            options: {
                run: true,
                growlOnSuccess: false,
                reporter: 'Min'
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

    grunt.registerTask('incrementVersion', function () {
        var files = this.options().files;
        grunt.file.expand(files).forEach(function (file) {
            var mainFile = grunt.file.read(file);
            var updated = grunt.template.process(mainFile, { data: grunt.file.readJSON('package.json') });
            grunt.file.write(file, updated);
        });
    });
    grunt.config.set('incrementVersion', {
        options: {
            files:  ['./dist/*.js']
        }
    });

    grunt.registerTask('test', ['browserify2:edge', 'mocha']);
    grunt.registerTask('documentation', ['markdox']);
    grunt.registerTask('validate', ['jshint:all', 'jscs', 'test']);
    grunt.registerTask('production', ['validate', 'browserify2:mapped', 'browserify2:min', 'browserify2:components', 'copy:components', 'documentation']);

    grunt.registerTask('release', function (type) {
        //TODO: Integrate 'changelog' in here when it's stable
        type = type ? type : 'patch';
        ['bump-only:' + type, 'changelog', 'production', 'incrementVersion', 'bump-commit'].forEach(function (task) {
            grunt.task.run(task);
        });
    });

    grunt.registerTask('default', ['browserify2:edge', 'browserify2:components', 'copy:components', 'mocha:test', 'watch']);
};
