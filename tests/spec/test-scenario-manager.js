(function () {
    'use strict';

    var runOptions = {
        model: 'model.eqn',
        account: 'forio-dev',
        project: 'js-libs'
    };

    describe('Scenario Manager', function () {
        var server;
        beforeEach(function () {
            server = sinon.fakeServer.create();
            server.respondImmediately = true;
        });

        afterEach(function () {
            server.restore();
        });

        describe('constructor', ()=> {
            it('should create a new baseline run manager', ()=> {
                
            });
            it('should create a new current run manager', ()=> {
                
            });
            it('should create a new baseline run on instantiation', ()=> {
                
            });
        });
        describe('#getSavedRuns', function () {
            var runService;

            beforeEach(function () {

            });

            it('should query with the right params', function () {
                
            });
            it('should allow over-riding modifiers', function () {
                
            });

            describe('when variables are requested', function () {
                it('should not get variables if no runs exist', function () {
                    
                });
                it('should not get variables if not asked for', function () {
                    
                });
                it('should query variables service if asked for variables', function () {
                    
                });
            });

        });
    });
}());
