(function () {

    'use strict';

    var root = this;
    var F = root.F;
    var $;

    if (typeof require !== 'undefined') {
        $ = require('jquery');
    } else {
        $ = root.jQuery;
    }

    var defaults = {
        validFilter: { saved: true }
    };

    function ScenarioManager(options) {
        this.options = $.extend(true, {}, defaults, options);
        this.runService = this.options.run || new F.service.Run(this.options);
    }

    ScenarioManager.prototype = {
        getRuns: function (filter) {
            this.filter = $.extend(true, {}, this.options.validFilter, filter);
            return this.runService.query(this.filter);
        },

        loadVariables: function (vars) {
            return this.runService.query(this.filter, { include: vars });
        },

        save: function (run, meta) {
            return this._getService(run).save($.extend(true, {}, { saved: true }, meta));
        },

        archive: function (run) {
            return this._getService(run).save({ saved: false });
        },

        _getService: function (run) {
            if (typeof run === 'string') {
                return new F.service.Run($.extend(true, {},  this.options, { filter: run }));
            }

            if (typeof run === 'object' && run instanceof F.service.Run) {
                return run;
            }

            throw new Error('Save method requires a run service or a runId');
        },

        getRun: function (runId) {
            return new F.service.Run($.extend(true, {},  this.options, {filter: runId}));
        }

    };

    if (typeof require !== 'undefined') {
        module.exports = ScenarioManager;
    } else {
        if (!root.F) { root.F = {};}
        if (!root.F.manager) { root.F.manager = {};}
        if (!root.F.manager.strategy) { root.F.manager.strategy = {};}
        root.F.manager.ScenarioManager = ScenarioManager;
    }
}).call(this);
