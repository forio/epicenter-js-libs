module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        watch: {
            tests: {
                files: ['tests/spec/**/*.js'],
                tasks: ['mocha:test']
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
