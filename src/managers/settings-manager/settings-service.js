import DataService from 'service/data-api-service';
import { makePromise, result } from 'util/index';
import { omit } from 'util/object-util';
import SavedRunsManager from 'managers/scenario-manager/saved-runs-manager';

function sanitize(obj) {
    return omit(obj, ['id', 'lastModified']);
}

class SettingsService {
    /**
     * @param {object} opts 
     * @property {AccountAPIServiceOptions} opts.run Parameters to pass on to run service (account / project / model / files etc.)
     * @property {object} [opts.settings]
     * @property {string} [opts.settings.collection]
     * @property {object | function(): object | function(): Promise<object>} [opts.settings.collection]
     */
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

    _updateDraftOrCreate(settings, meta) {
        function getLastDraft() {
            if (this.state.currentDraft) {
                return $.Deferred().resolve(this.state.currentDraft).promise();
            }
            return this.list().then((settingsList)=> {
                const lastSettings = settingsList[0] || {};
                if (lastSettings.isDraft) {
                    return lastSettings;
                } 
                return this.ds.save({});
            });
        }

        return getLastDraft.call(this).then((draft)=> {
            const newSettings = $.extend(true, {}, draft, settings, meta);
            return this.ds.saveAs(draft.id, sanitize(newSettings));
        }).then((d)=> {
            this.state.currentDraft = d.isDraft ? d : null;
            return d;
        });
    }

    /**
     * Evaluates and returns default settings.
     * @returns {Promise<object>}
     */
    getDefaults() {
        const defaultsProm = makePromise(result(this.options.settings.defaults));
        return defaultsProm;
    }

    /**
     * Retreive all settings objects
     * 
     * @example
     * settings.getRecent({ excludeDrafts: true }).then((list)=> {
     *  console.log('Found', list.length, 'active settings');
     * });
     * 
     * @param {{excludeDrafts: boolean}} [options] optionally retreive only the active settings. Defaults to false.
     * @returns {Promise<object[]>} 
     */
    list(options) {
        return this.ds.load('', { sort: 'key', direction: 'desc' }).then((settingHistory)=> {
            const sorted = settingHistory.sort((a, b)=> {
                return a.key > b.key ? -1 : 1;
            });
            if (options && options.excludeDrafts) {
                return sorted.filter((s)=> s.isDraft === false);
            }
            return sorted;
        });
    }

    /**
     * Returns currently active settings, or undefined if there are none.
     * 
     * @example
     * settings.getCurrentActive().then((settings)=> {
     *  console.log(settings ? 'Active settings found', 'No settings found');
     * });
     * @returns {Promise<object[]>}
     */
    getCurrentActive() {
        return this.list({ excludeDrafts: true }).then((activeSettings)=> {
            const lastActive = activeSettings[0];
            return lastActive;
        });
    }

    /**
     * Returns most recent settings; creates a new draft if none exist. Use to show current state on settings screen.
     * @example
     * settings.getMostRecent().then((settings)=> { //Automatically creates a new draft if none exist
            const allowCreateNew = !settings.isDraft;
            $('#btn-create-new').attr('disabled', !allowCreateNew);
            $('#btn-activate-settings', '#btn-reset').attr('disabled', allowCreateNew);
        });
     * @returns {Promise<object>}
     */
    getMostRecent() {
        return this.list().then((settingsList)=> {
            const lastSettings = settingsList[0];
            if (!lastSettings) {
                return this.createDraft({ useDefaults: true });
            }
            return lastSettings;
        });
    }

    /**
     * Creates new draft settings. Usually used when there's already 'active' settings, and you want to start with a new set without affecting existing runs.
     * 
     * @example
     * $('#btn-create-new').on('click', ()=> {
            settings.createDraft().then((settings)=> {
                alert('Draft created');
            });
        });
     * 
     * @param {{ useDefaults: boolean }} options If `useDefaults` is set, a draft is created with the default settings, else it clones the last available settings (either draft or active)
     * @returns {Promise<object>}
     */
    createDraft(options) {
        function getSettings(options) {
            if (options.useDefaults) {
                return this.getDefaults();
            }
            return this.list().then((settingsList)=> {
                return settingsList[0] || this.getDefaults();
            });
        }
        return getSettings.call(this, options || {}).then((defaults)=> {
            const newSettings = $.extend(true, {}, defaults, { isDraft: true, key: Date.now() });
            return this.ds.save(sanitize(newSettings));
        }).then((d)=> {
            this.state.currentDraft = d;
            return d;
        });
    }

    /**
     * Resets draft to defaults. If you need to reset to previous settings, use `createDraft` instead.
     * 
     * @example
     * $('#btn-reset').on('click', ()=> {
            settings.resetDraft().then((settings)=> {
                updateUIWithSettings(settings);
            });
        });

     * @returns {Promise<object>}
     */
    resetDraft() {
        return this.createDraft({ useDefaults: true });
    }

    /**
     * Updates current draft with provided settings. Creates draft if none exist.
     * 
     * @example
     * settings.updateDraft({ someValue: true });
     * 
     * @param {Object} settings
     * @returns {Promise<object>}
     */
    updateDraft(settings) {
        return this._updateDraftOrCreate(settings);
    }

    /**
     * Deletes settings identified by key and (optionally) runs created with those settings.
     * 
     * @example
     * 
     * settings.list().then((list)=> {
     *   settings.delete(list[0].id);
     * });
     * 
     * @param {string} settingsId Id for settings object to delete
     * @param {{trashAssociatedRuns: boolean}} options Marks the runs created with that settings as 'trashed'. Defaults to false
     * @returns {Promise<object>}
     */
    delete(settingsId, options) {
        return this.ds.remove(settingsId).then((res)=> {
            const shouldTrashDeleteRuns = options && options.trashAssociatedRuns;
            if (shouldTrashDeleteRuns) return res;

            const sm = new SavedRunsManager(this.options.run);
            return sm.remove({ scope: { 
                trackingKey: settingsId
            } }).then(()=> res);
        });
    }

    /**
     * Activates the current settings, and makes it so it can no longer be modified; this will be applied to new runs (if you use the settings strategy)
     *  
     * @example
     * $('#btn-activate-settings').on('click', ()=> {
            settings.saveAndActivate().then((settings)=> {
                updateUIWithSettings(settings);
            });
        });
     * 
     * @param {Object} settings
     * @returns {Promise<object>}
     */
    saveAndActivate(settings) {
        return this._updateDraftOrCreate(settings, { isDraft: false, key: Date.now() });
    }
}

export default SettingsService;