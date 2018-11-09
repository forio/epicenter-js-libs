import SettingsManager from './settings-service';
import ReuseWithTracking from 'managers/run-strategies/reuse-by-tracking-key';
import PubSub from 'util/pubsub';
import { omit } from 'util/object-util';

const actions = {
    SETTINGS_DELETED: 'SETTINGS_DELETED',
    SETTINGS_ACTIVATED: 'SETTINGS_ACTIVATED',
    DRAFT_CREATED: 'DRAFT_CREATED',
    DRAFT_UPDATED: 'DRAFT_UPDATED',
};
class ClassManager {
    constructor(options) {
        const defaultSettings = {
            run: {},
            settings: {
                collection: 'settings',
                defaults: {},
            },
        };

        this.options = $.extend(true, {}, defaultSettings, options);
        this.settings = new SettingsManager(this.options);
        this.channel = new PubSub();
    }

    getChannel() {
        const rawDataChannel = this.settings.ds.getChannel();
        rawDataChannel.subscribe('', (res, meta)=> {
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
                console.log('getChannel: Unknown subtype', res, meta);
            }
        });
        return this.channel;
    }
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
                            throw new Error('NO_ACTIVE_SETTINGS');
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
}

ClassManager.actions = actions;

export default ClassManager;