module.exports = function (grunt) {

    require('jit-grunt')(grunt, {
        'bump-only': 'grunt-bump',
        'bump-commit': 'grunt-bump',
        changelog: 'grunt-conventional-changelog',
    });

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')
    });

    grunt.file.expand('build/*.js').forEach(function (task) {
        require('./' + task)(grunt);
    });

    grunt.registerTask('test-dev', ['webpack:edge', 'karma:testList']);
    grunt.registerTask('test', ['templates', 'webpack:edge', 'webpack:components', 'karma:testWithCoverage']);
    grunt.registerTask('documentation', ['eslint', 'markdox']);
    grunt.registerTask('validate', ['eslint', 'test']);
    grunt.registerTask('concatCometd', ['uglify:cometdMin', 'uglify:cometdDebug']);
    grunt.registerTask('components', ['templates', 'webpack:components', 'copy:components']);
    grunt.registerTask('production', ['concatCometd', 'validate', 'webpack:mapped', 'webpack:min', 'components', 'documentation']);

    grunt.registerTask('release', function (type) {
        //TODO: Integrate 'changelog' in here when it's stable
        type = type ? type : 'patch';
        ['bump-only:' + type, 'production', 'bump-commit'].forEach(function (task) {
            grunt.task.run(task);
        });
    });

    grunt.registerTask('default', ['concatCometd', 'webpack:edge', 'components', 'watch']);
};
