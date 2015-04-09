module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')
    });

    grunt.file.expand('grunt/*.js').forEach(function (task) {
        require('./' + task)(grunt);
    });

    grunt.registerTask('test', ['browserify:edge', 'browserify:instrumented', 'mocha', 'coverage-report']);
    grunt.registerTask('documentation', ['markdox']);
    grunt.registerTask('validate', ['jshint:all', 'jscs', 'test']);
    grunt.registerTask('concatCometd', ['uglify:cometdMin', 'uglify:cometdDebug']);
    grunt.registerTask('production', ['concatCometd', 'validate', 'browserify:mapped', 'browserify:min', 'documentation']);

    grunt.registerTask('release', function (type) {
        //TODO: Integrate 'changelog' in here when it's stable
        type = type ? type : 'patch';
        ['bump-only:' + type, 'changelog', 'production', 'bump-commit'].forEach(function (task) {
            grunt.task.run(task);
        });
    });

    grunt.registerTask('default', ['concatCometd', 'browserify:edge', 'browserify:instrumented', 'watch']);
};
