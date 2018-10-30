import DataService from 'service/data-api-service';
import SavedRunsManager from 'managers/scenario-manager/saved-runs-manager';

class SettingsManager {
    constructor(opts) {
        const defaults = {
            run: {},
            defaults: {
                runLimit: 1000000, //Infinity isn't json serializable so using a big number instead
            },
            settingsKey: 'settings',
            allowRunCreateWithEmptySettings: true
        };

        this.options = $.extend(true, {}, defaults, this.options);
        this.ds = new DataService({
            root: this.options.settingsKey,
            scope: DataService.SCOPES.GROUP
        });
    }

    _updateDraftOrCreate(settings, meta) {
        return this.getAll().then((settingsList)=> {
            const lastSettings = settingsList[0] || {};
            const newSettings = $.extend(true, {}, lastSettings, settings, meta);
            if (lastSettings.isDraft) {
                return this.ds.saveAs(lastSettings.id, newSettings);
            } 
            return this.ds.save(newSettings);
        });
    }

    getAll(excludeDrafts) {
        const ds = new DataService({
            root: this.options.settingsKey,
            scope: DataService.SCOPES.GROUP
        });
        return ds.load().then((settingHistory)=> {
            const sorted = settingHistory.sort((a, b)=> {
                return a.key > b.key ? -1 : 1;
            });
            if (excludeDrafts) {
                return sorted.filter((s)=> s.isDraft === false);
            }
            return sorted;
        });
    }

    getCurrentActive() {
        return this.getAll(true).then((activeSettings)=> {
            const lastActive = activeSettings[0];
            return lastActive;
        });
    }

    getMostRecent() {
        return this.getAll().then((settingsList)=> {
            const lastSettings = settingsList[0];
            if (!lastSettings) {
                return this.createDraft();
            }
            return lastSettings;
        });
    }

    createDraft(settings) {
        const { defaults } = this.options;
        const newSettings = $.extend(true, {}, defaults, settings, { isDraft: true, key: Date.now() });
        return this.ds.save(newSettings);
    }
    updateDraft(settings) {
        return this._updateDraftOrCreate(settings);
    }
    saveAndActivate(settings) {
        return this._updateDraftOrCreate(settings, { isDraft: false, key: Date.now() });
    }

    getRunsForSettings(settingsId) {
        const runOptions = $.extend(true, {}, this.options.run, { scope: { 
            trackingKey: settingsId
        } });
        const sm = new SavedRunsManager(runOptions);
        return sm;
    }
}

export default SettingsManager;