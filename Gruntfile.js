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
                        src: 'src/utils/configuration-service.js', dest: 'documentation/generated/configuration-service.js.md'
                    },
                    {
                        src: 'src/services/run-api-service.js', dest: 'documentation/generated/run-api-service.js.md'
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
