import SavedRunsManager from 'managers/scenario-manager/saved-runs-manager';
import SettingsService from './settings-service';

import ReuseWithTracking from 'managers/run-strategies/reuse-by-tracking-key';
import PubSub from 'util/pubsub';
import { omit } from 'util/object-util';
import { rejectPromise } from 'util/index';

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
     * @param {object} options 
     * @returns {object} Run Strategy 
     */
    getUserRunStrategy(options) {
        const defaults = {
            allowRunsWithoutSettings: true,
            applySettings: ()=> {}
        };
        const opts = $.extend({}, defaults, options);
        const strategy = new ReuseWithTracking({
            strategyOptions: {
                settings: ()=> {
                    return this.settings.getCurrentActive().then((settings)=> {
                        if (!settings) {
                            if (opts.allowRunsWithoutSettings) {
                                return this.settings.getDefaults();
                            }
                            return rejectPromise('NO_ACTIVE_SETTINGS', 'The facilitator has not opened the simulation for gameplay.');
                        }
                        return settings;
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


    getSavedRunsManagerForSetting(settingsId) {
        const runOptions = $.extend(true, {}, this.options.run, { scope: { 
            trackingKey: settingsId
        } });
        const sm = new SavedRunsManager(runOptions);
        return sm;
    }
}

SettingsManager.actions = actions;

export default SettingsManager;