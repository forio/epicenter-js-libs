var serviceOptions = getServiceOptions();

function init() {
    var am = new F.manager.AuthManager();
    if (!am.isLoggedIn()) {
        alert('Not logged in');
        return;
    }

    var settingsManager = new F.manager.Settings({
        run: serviceOptions,
        settings: {
            defaults: {
                name: 'Foobard'
            }
        },
        multiplayer: true
    });
    
    var strategy = settingsManager.getUserRunStrategy({
        // allowCreateRun: (settings)=> {
        //     return settings && +settings.isOpen === 1;
        // },
        applySettings: (runService, settings, run)=> {
            let prom = runService.save({ name: settings.name });
            if (settings.Price) {
                prom = prom.then(()=> {
                    runService.variables().save({ Price: +settings.Price });
                });
            }
            return prom.then(()=> {
                return Object.assign({}, run, { name: settings.name, runLimit: settings.runLimit });
            });
        }
    });

    
    function updateUI(run) {
        $('#curr-run-id').html(run.id);
        $('#run-name').html(run.name);
        $('#run-limit').html(run.runLimit);
        $('#price-val').html(run.variables.Price[run.variables.Price.length - 1]);
    }
    var rm = new F.manager.RunManager({
        run: serviceOptions,
        strategy: strategy
    });

    function getRunAndUpdate() {
        rm.getRun(['Price']).then((run)=> {
            updateUI(run);
        }, (e)=> {
            console.error('Run errors', e);
        });
    }
    

    $('#btn-reset').on('click', ()=> {
        rm.reset().then(()=> {
            getRunAndUpdate();
        }).catch((e)=> {
            alert(e.message);
        });
    });

    const actions = F.manager.Settings.actions;
    const channel = settingsManager.getChannel();
    channel.subscribe([actions.SETTINGS_ACTIVATED, actions.SETTINGS_DELETED], ()=> {
        getRunAndUpdate();
    });

    getRunAndUpdate();
    // channel.subscribe();
}

init();