## Settings Manager

The Settings Manager is designed for controlling in-game settings - which can be model variables, or text descriptions, or any combination - within a group, for authenticated turn-by-turn projects.

### Facilitator workflow

#### Class settings
In a typical turn-by-turn game, a facilitator would login to a class and administer settings using a UI somewhat similar to the one below:

![Class Settings](../../assets/settings-manager-example.png)

They would then go through the following steps:

1. Create 'draft' settings
Drafts settings are persisted, can be tested, but are not applied to any student runs yet.

2. (Optionally) Set a  Run Limit for the number of runs which can be created with this settings.
If the settings includes a special key called a `runLimit` the settings strategy (See)

3. 'Activate' the draft settings once done with changes
These settings then apply to any new runs created after this point. The Settings Manager provides hooks for handling existing runs in progress, and also lets each project determine what "applying" settings means in it's context.

**Example:**
```js
var settingsManager = new F.manager.Settings({
    run: serviceOptions,
    settings: {
        defaults: { //Default settings to initialize new drafts with (optional)
            name: 'myScenario',
            modelVariable: 22,
            runLimit: 3, //Optional, but if specificied then enforced by user-strategy
        }
    },
});

$('#btn-create-new').on('click', ()=> {
    settingsManager.settings.createDraft().then((settings)=> {
        alert('Draft created');
        updateUIWithSettings(settings);
    });
});
$('#btn-activate-settings').on('click', ()=> {
    settingsManager.settings.saveAndActivate().then((settings)=> {
        alert('Activated');
        updateUIWithSettings(settings);
    });
});
$('#btn-reset').on('click', ()=> {
    settingsManager.settings.resetDraft().then((settings)=> {
        updateUIWithSettings(settings);
    });
});

settingsManager.settings.getMostRecent().then((settings)=> { //Automatically creates a new draft if none exist
    const allowCreateNew = !settings.isDraft;
    $('#btn-create-new').attr('disabled', !allowCreateNew);
    $('#btn-activate-settings', '#btn-reset').attr('disabled', allowCreateNew);
});

```

#### Class Results

The Settings Manager provides a helper function to get all runs with the most recent active settings, for displaying results.

```js
settingsManager.getRuns(['Price', 'OtherVariable']).then((runs)=> { .. });
```
Note that this defaults to filtering for saved runs, which is good practice for facilitator screens. To filter otherwise, just pass in `settingsManager.getRuns(['Price', 'OtherVariable'], { saved: false })`. See [SavedRunsManager options](../saved-runs-manager/#getruns-variables-filter-modifiers-) for a full list of parameters. 

### End-User workflow

#### Run Strategy
To properly apply and use the new settings, the 'end-user' needs to use a strategy provided by the SettingsManager

```js
var settingsManager = new F.manager.Settings({
    run: serviceOptions,
});
var strategy = settingsManager.getUserRunStrategy({
    applySettings: (runService, settings, run)=> {
        // This example assumes all the settings are model variables, while they're typically a combination of model variables and run metadata (name / description etc.) and may involve calls to rs.save() in addition.
        return run.variables().save(settings); 
    }
});

var rm = new F.manager.RunManager({
    strategy: strategy
});
rm.getRun(...);
```

#### Settings channel
The settings manager provides a convenience wrapper around the cometd channel with more semantic actions.

```js
const channel = settingsManager.getChannel();
channel.subscribe([actions.SETTINGS_ACTIVATED, actions.SETTINGS_DELETED], ()=> {
    getRunAndUpdateUI();
});
```