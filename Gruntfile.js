module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-markdox');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        watch: {
            source: {
                files: ['src/**/*.js'],
                tasks: ['mocha:test']
            },
            tests: {
                files: ['tests/spec/**/*.js'],
                tasks: ['mocha:test']
            }
        },
        markdox: {
            options: {
               // Task-specific options go here.
               template: 'documentation/template.ejs'
            },
            target: {
                // files: function() {
                //                    var mapping = [];
                //                    grunt.file.expand('src/**/*.js').forEach(function(file) {
                //                        var target = file.split('/').pop() + '.md';
                //                        mapping.push({src: file, dest: 'documentation/' + target});
                //                    });
                //                    return mapping;
                //                }()
                files:  [
                    {
                        src: 'src/service/configuration-service.js', dest: 'documentation/generated/configuration-service.html.md'
                    },
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
};
