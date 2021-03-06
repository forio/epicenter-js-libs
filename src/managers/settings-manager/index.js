import SavedRunsManager from 'managers/saved-runs-manager';
import SettingsService from './settings-service';

import ReuseWithTracking from 'managers/run-strategies/reuse-by-tracking-key';
import ReuseWithTrackingMultiplayer from 'managers/run-strategies/multiplayer-with-tracking-key';

import PubSub from 'util/pubsub';
import { omit } from 'util/object-util';
import { rejectPromise } from 'util/index';
import WorldAPIAdapter from 'service/world-api-adapter';

const actions = {
    SETTINGS_DELETED: 'SETTINGS_DELETED',
    SETTINGS_ACTIVATED: 'SETTINGS_ACTIVATED',
    DRAFT_CREATED: 'DRAFT_CREATED',
    DRAFT_UPDATED: 'DRAFT_UPDATED',
};

class SettingsManager {
    /**
     * @param {object} options
     * @property {AccountAPIServiceOptions} options.run Parameters to pass on to run service (account / project / model / files etc.)
     * @property {object} [options.settings]
     * @property {string} [options.settings.collection]
     * @property {boolean} [options.multiplayer] Set to true for multiplayer games.
     * @property {boolean} [options.interruptRunsInProgress] Once settings are activated, this determines if existing runs can continue or new runs are forced. If multiplayer=true, this deletes the existing run for each world.
     *
     * @property {object | function(): object | function(): Promise<object>} [options.settings.collection]
     */
    constructor(options) {
        const defaultSettings = {
            run: {},
            settings: {
                collection: 'settings',
                defaults: {},
            },

            multiplayer: false,
            interruptRunsInProgress: true,
        };

        this.options = $.extend(true, {}, defaultSettings, options);
        this.settings = new SettingsService(this.options);
        this.channel = new PubSub();
        this.state = {
            subscription: null
        };

        if (this.options.interruptRunsInProgress && this.options.multiplayer) {
            const defaultSaveAndActivate = this.settings.saveAndActivate;
            this.settings.saveAndActivate = function () {
                const originalArgs = Array.prototype.slice.call(arguments);
                const ws = new WorldAPIAdapter(this.options.run);
                return ws.list().then((worlds)=> {
                    const deletionPromises = worlds.map((world)=> {
                        return ws.deleteRun(world.id);
                    });
                    return $.when.apply(null, deletionPromises).then(()=> {
                        return defaultSaveAndActivate.apply(this.settings, originalArgs);
                    });
                });
            }.bind(this);
        }
    }

    /**
     * Get a cometd channel to subscribe to settings changes. The list of available topics are:
     *
     * | Topic | Description |
     * | ------------- | ------------- |
     * | ALL | All events |
     * | SETTINGS_ACTIVATED | A new draft has been made active, or a currently active draft was edited |
     * | SETTINGS_DELETED | A settings document (either current or historical)  was deleted |
     * | DRAFT_CREATED | A new draft was created |
     * | DRAFT_UPDATED | A draft document was updated  |
     *
     * @returns {Channel} Channel instance
     */
    getChannel() {
        if (this.state.subscription) {
            return this.channel;
        }

        const rawDataChannel = this.settings.ds.getChannel();
        this.state.subscription = rawDataChannel.subscribe('', (res, meta)=> {
            if (meta.subType === 'delete') {
                this.channel.publish(actions.SETTINGS_DELETED, meta);
            } else if (meta.subType === 'new') {
                this.channel.publish(actions.DRAFT_CREATED, res);
            } else if (meta.subType === 'update') {
                if (res.isDraft) {
                    this.channel.publish(actions.DRAFT_UPDATED, res);
                } else {
                    this.channel.publish(actions.SETTINGS_ACTIVATED, res);
                }
            } else {
                console.warn('getChannel: Unknown subtype', res, meta);
            }
        });
        this.channel.rawDataChannel = rawDataChannel;
        return this.channel;
    }

    /**
     * Use to get a strategy to use for user-runs.
     *
     * @example
     * var settingsManager = new F.manager.Settings({
     *      run: serviceOptions,
     * });
     * var strategy = settingsManager.getUserRunStrategy({
     *  applySettings: (runService, settings, run)=> {
     *      return run.variables().save(settings); // This example assumes all the settings are model variables, while they're typically a combination of model variables and run metadata (name / description etc.) and may involve calls to rs.save() in addition.
     *  }});
     * @param {object} options
     * @property {function(settings):boolean} [options.allowCreateRun] Use if you want to disallow creating new runs for some combination of settings, for e.g. if the settings are invalid or the simulation is 'closed' to gameplay. Defaults to always allowing.
     * @property {function(RunService, settings, run):void} [options.applySettings] Function to apply settings to given run.
     * @returns {object} Run Strategy
     */
    getUserRunStrategy(options) {
        const defaults = {
            allowCreateRun: ()=> true,
            applySettings: ()=> {},
        };
        const opts = $.extend({}, defaults, options);
        const Strategy = this.options.multiplayer ? ReuseWithTrackingMultiplayer : ReuseWithTracking;
        const strategy = new Strategy({
            strategyOptions: {
                settings: ()=> {
                    return this.settings.getCurrentActive().then((settings)=> {
                        if (!opts.allowCreateRun(settings)) {
                            return rejectPromise('RUN_CREATION_NOT_ALLOWED', 'allowCreateRun check failed');
                        }
                        return settings || this.settings.getDefaults();
                    }).then((settings)=> {
                        const cleanedSettings = omit(settings, ['id', 'lastModified', 'isDraft', 'key']);
                        return $.extend(true, {}, cleanedSettings, { trackingKey: settings.id || 'defaultSettings' });
                    });
                },
                onCreate: opts.applySettings,
            }
        });
        return strategy;
    }

    /**
     * Helper method to create a [SavedRunsManager](../saved-runs-manager) instance with a preset tracking key
     * @param {string} settingsId
     * @return {SavedRunsManager}
     */
    getSavedRunsManagerForSetting(settingsId) {
        const runOptions = $.extend(true, {}, this.options.run, { scope: {
            trackingKey: settingsId
        } });
        const sm = new SavedRunsManager({ run: runOptions, scopeByUser: false });
        return sm;
    }

    /**
     * Helper method to get runs for most recent settings. Runs in the result, will have a `settings` property with the currently active settings set on it.
     *
     * @param {*} savedRunManagerParams See  [SavedRunsManager options](../saved-runs-manager/#getruns-variables-filter-modifiers-) for parameters
     * @return {Promise<object[]>}
     */
    getRuns(savedRunManagerParams) {
        return this.settings.getCurrentActive().then((settings)=> {
            if (!settings) {
                return [];
            }
            const sm = this.getSavedRunsManagerForSetting(settings.id);
            return sm.getRuns.apply(sm, arguments).then((runs)=> {
                return (runs || []).map((run)=> {
                    return $.extend(true, run, { settings: settings });
                });
            });
        });
    }
}

SettingsManager.actions = actions;

export default SettingsManager;