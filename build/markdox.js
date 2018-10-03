module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-markdox');
    grunt.config.set('markdox', {
        options: {
            // Task-specific options go here.
            template: 'documentation/template.ejs'
        },
        strategies: {
            options: {
                template: 'documentation/run-strategies-template.ejs'
            },
            files: {
                'documentation/generated/strategies/index.html.md': [
                    'src/managers/run-strategies/reuse-never.js', 
                    'src/managers/run-strategies/reuse-per-session.js',
                    'src/managers/run-strategies/reuse-across-sessions.js',
                    'src/managers/run-strategies/multiplayer-strategy.js',
                    'src/managers/run-strategies/none-strategy.js',
                    'src/managers/run-strategies/deprecated/new-if-initialized-strategy.js',
                    'src/managers/run-strategies/deprecated/new-if-persisted-strategy.js',
                    'src/managers/run-strategies/index.js' // must go at the end! we are special-casing the processing of this file
                ],
            }
        },
        es6Docs: {
            options: {
                template: 'documentation/documentation-es6-template.ejs',
            },
            files: [
                {
                    src: 'src/managers/user-manager/index.js',
                },
                //     src: 'src/service/consensus-api-service/consensus-service.js',
                //     src: 'src/service/consensus-api-service/consensus-group-service.js',
                //     src: 'src/service/run-api-service/variables-api-service/index.js',
                //     src: 'src/service/channel-service/index.js',
                //     src: 'src/managers/auth-manager/index.js',
                //     src: 'src/managers/world-manager/index.js',
                //     src: 'src/managers/epicenter-channel-manager/channel-manager/index.js',
                //     src: 'src/managers/epicenter-channel-manager/index.js',
                //     src: 'src/managers/scenario-manager/index.js',
                //     src: 'src/managers/scenario-manager/scenario-strategies/baseline-strategy/index.js',
                //     src: 'src/managers/scenario-manager/scenario-strategies/reuse-last-unsaved/index.js',
                //     src: 'src/managers/scenario-manager/saved-runs-manager/index.js',
                // }, 
               
            ]
        }
    });
};
