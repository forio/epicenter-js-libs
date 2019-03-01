import SavedRunsManager from 'managers/saved-runs-manager';
import SettingsService from './settings-service';
import ReuseWithTracking from 'managers/run-strategies/reuse-by-tracking-key';
import PubSub from 'util/pubsub';
import { omit } from 'util/object-util';
import { rejectPromise, makePromise } from 'util/index';

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
     * @property {object | function(): object | function(): Promise<object>} [options.settings.collection]
     */
    constructor(options) {
        const defaultSettings = {
            run: {},
            settings: {
                collection: 'settings',
                defaults: {},
            },
        };

        this.options = $.extend(true, {}, defaultSettings, options);
        this.settings = new SettingsService(this.options);
        this.channel = new PubSub();
        this.state = {
            subscription: null
        };
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
        return this.channel;
    }

    /**
     * Use to get a strategy to use for user-runs. 
     * 
     * @example
     * var settingsManager = new F.manager.Settings({
            run: serviceOptions,
        });
        var strategy = settingsManager.getUserRunStrategy({
            applySettings: (runService, settings, run)=> {
                return run.variables().save(settings); // This example assumes all the settings are model variables, while they're typically a combination of model variables and run metadata (name / description etc.) and may involve calls to rs.save() in addition.
            }
        });
     * @param {object} options 
     * @property {function(settings):boolean} [options.allowCreateRun] Use if you want to disallow creating new runs for some combination of settings, for e.g. if the settings are invalid or the simulation is 'closed' to gameplay. Defaults to always allowing.
     * @property {function(RunService, settings, run):void} [options.applySettings] Function to apply settings to given run.
     * @returns {object} Run Strategy 
     */
    getUserRunStrategy(options) {
        const defaults = {
            allowCreateRun: ()=> true,
            applySettings: ()=> {}
        };
        const opts = $.extend({}, defaults, options);
        const strategy = new ReuseWithTracking({
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
     * Helper method to get runs for most recent settings
     * @param {*} savedRunManagerParams See  [SavedRunsManager options](../saved-runs-manager/#getruns-variables-filter-modifiers-) for parameters
     * @return {Promise<object[]>}
     */
    getRuns(savedRunManagerParams) {
        return this.settings.getMostRecent().then((settings)=> {
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