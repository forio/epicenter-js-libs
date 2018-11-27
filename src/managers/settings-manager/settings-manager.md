## Settings Manager

The Settings Manager is designed for authenticated turn-by-turn projects, using the following workflow:

- A Facilitator creates 'draft' settings (model variables / text descriptions) -- drafts are settings which are persisted, can be tested, but are not applied to any student runs yet.
- A draft can then be 'activated', at which point they then apply to any new runs created after that point. The manager provides hooks for handling existing runs in progress.


### Using the Settings Manager for the facilitator
```js
var settingsManager = new F.manager.Settings({
    run: serviceOptions,
    settings: {
        defaults: {
            name: 'myScenario',
            modelVariable: 22,
            runLimit: 3, //Optional, but if specificied then enforced by user-strategy
            { ...otherSettings }
        }
    },
});

settingsManager.settings.getMostRecent().then((settings)=> { //Automatically creates a new draft if none exist
    const allowCreateNew = !settings.isDraft;
    $('#btn-create-new').attr('disabled', !allowCreateNew);
    $('#btn-activate-settings', '#btn-reset').attr('disabled', allowCreateNew);
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
```

## Using the Settings Manager for the user strategy

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

const channel = settingsManager.getChannel();
channel.subscribe([actions.SETTINGS_ACTIVATED, actions.SETTINGS_DELETED], ()=> {
    getRunAndUpdateUI();
});
```