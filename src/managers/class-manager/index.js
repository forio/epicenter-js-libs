import SettingsManager from './settings-manager';
import ReuseWithTracking from 'managers/run-strategies/reuse-by-tracking-key';

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
    }

    getUserRunStrategy(options) {
        const defaults = {
            allowRunsWithoutSettings: true,
            applySettings: ()=> {}
        };
        const opts = $.extend({}, defaults, options);
        const strategy = new ReuseWithTracking({
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
                    return $.extend(true, {}, settings, { trackingKey: settings.id || 'defaultSettings' });
                });
            },
            onCreate: opts.applySettings,
        });
        return strategy;
    }
}

export default ClassManager;