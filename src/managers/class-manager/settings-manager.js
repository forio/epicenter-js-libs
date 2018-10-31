import DataService from 'service/data-api-service';
import SavedRunsManager from 'managers/scenario-manager/saved-runs-manager';
import { makePromise, result } from 'util/index';

class SettingsManager {
    constructor(opts) {
        const defaults = {
            run: {},
            settings: {
                collection: 'settings',
                defaults: {},
            },
        };

        this.options = $.extend(true, {}, defaults, opts);

        const serviceOptions = $.extend(true, {}, this.options.run, {
            root: this.options.settings.collection,
            scope: DataService.SCOPES.GROUP
        });
        this.ds = new DataService(serviceOptions);

        this.state = {
            currentDraft: null
        };
    }

    /**
     * @param {{excludeDrafts: boolean}} [options]
     * @returns {Promise<object[]>} 
     */
    getAll(options) {
        return this.ds.load().then((settingHistory)=> {
            const sorted = settingHistory.sort((a, b)=> {
                return a.key > b.key ? -1 : 1;
            });
            if (options && options.excludeDrafts) {
                return sorted.filter((s)=> s.isDraft === false);
            }
            return sorted;
        });
    }

    _updateDraftOrCreate(settings, meta) {
        function getLastDraft() {
            if (this.state.currentDraft) {
                return $.Deferred().resolve(this.state.currentDraft).promise();
            }
            return this.getAll().then((settingsList)=> {
                const lastSettings = settingsList[0] || {};
                if (lastSettings.isDraft) {
                    return lastSettings;
                } 
                return this.ds.save({});
            });
        }

        return getLastDraft.call(this).then((draft)=> {
            const newSettings = $.extend(true, {}, draft, settings, meta);
            return this.ds.saveAs(draft.id, newSettings);
        }).then((d)=> {
            this.state.currentDraft = d.isDraft ? d : null;
            return d;
        });
    }

    getCurrentActive() {
        return this.getAll({ excludeDrafts: true }).then((activeSettings)=> {
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

    getDefaults() {
        const defaultsProm = makePromise(result(this.options.settings.defaults));
        return defaultsProm;
    }
    createDraft(settings) {
        return this.getDefaults().then((defaults)=> {
            const newSettings = $.extend(true, {}, defaults, settings, { isDraft: true, key: Date.now() });
            return this.ds.save(newSettings);
        }).then((d)=> {
            this.state.currentDraft = d;
        });
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