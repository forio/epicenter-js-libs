import SettingsManager from './settings-manager';
import ReuseWithTracking from 'managers/run-strategies/reuse-with-tracking-key';

class ClassManager {

    constructor(options) {
        const defaultSettings = {
            run: {},
            settings: {
                collection: 'settings',
                defaults: {},
            },

            allowRunsWithoutSettings: true,
            applySettingsToRun: ()=> {}
        };

        this.options = $.extend(true, {}, defaultSettings, this.options);

        this.settings = new SettingsManager(this.options);
        this.userStrategy = new ReuseWithTracking({
            settings: ()=> {
                return this.settings.getCurrentActive().then((settings)=> {
                    if (!settings) {
                        if (this.options.allowRunsWithoutSettings) {
                            return this.options.settings.defaults;
                        }
                        throw new Error('NO_ACTIVE_SETTINGS');
                    }
                    return settings;
                }).then((settings)=> {
                    return $.extend(true, {}, settings, { trackingKey: settings.id || 'defaultSettings' });
                });
            },
            onCreate: this.options.applySettingsToRun,
        });
    }
}

export default ClassManager;