import DataService from 'service/data-api-service';
import { makePromise, result } from 'util/index';
import { omit } from 'util/object-util';

function sanitize(obj) {
    return omit(obj, ['id', 'lastModified']);
}

/**
 * Thin wrapper around Data API for managing settings. Meant to be used in conjunction with the Settings Manager.
 */
class SettingsService {
    /**
     * @param {object} opts
     * @property {AccountAPIServiceOptions} opts.run Parameters passed on to run service
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
     * @param {{excludeDrafts: boolean}} [options]
     * @returns {Promise<object[]>}
     */
    getAll(options) {
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
     * @returns {Promise<object>}
     */
    getCurrentActive() {
        return this.getAll({ excludeDrafts: true }).then((activeSettings)=> {
            const lastActive = activeSettings[0];
            return lastActive;
        });
    }

    /**
     * Returns most recent settings; creates a new draft if none exist. Use to show current state on settings screen.
     * @returns {Promise<object>}
     */
    getMostRecent() {
        return this.getAll().then((settingsList)=> {
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
     * @param {{ useDefaults: boolean }} options If `useDefaults` is set, a draft is created with the default settings, else it clones the last available settings (either draft or active)
     * @returns {Promise<object>}
     */
    createDraft(options) {
        function getSettings(options) {
            if (options.useDefaults) {
                return this.getDefaults();
            }
            return this.getAll().then((settingsList)=> {
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
     * @returns {Promise<object>}
     */
    resetDraft() {
        return this.createDraft({ useDefaults: true });
    }

    /**
     * Updates current draft with provided settings. Creates draft if none exist.
     *
     * @param {Object} settings
     * @returns {Promise<object>}
     */
    updateDraft(settings) {
        return this._updateDraftOrCreate(settings);
    }

    /**
     * Updates current *active* settings.
     *
     * @param {Object} newSettings
     * @returns {Promise<object>}
     */
    updateActive(newSettings) {
        return this.getCurrentActive().then((settings)=> {
            if (!settings) {
                throw new Error('No active settings found');
            }
            const toSave = sanitize($.extend(true, {}, settings, newSettings));
            return this.ds.saveAs(settings.id, toSave);
        });
    }

    /**
     * Activates the current settings, and makes it so it can no longer be modified; this will be applied to new runs (if you use the settings strategy)
     *
     * @param {Object} settings
     * @returns {Promise<object>}
     */
    saveAndActivate(settings) {
        return this._updateDraftOrCreate(settings, { isDraft: false, key: Date.now() });
    }
}

export default SettingsService;