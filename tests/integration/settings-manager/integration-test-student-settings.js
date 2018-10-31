var serviceOptions = getServiceOptions();

function init() {
    var am = new F.manager.AuthManager();
    if (!am.isLoggedIn()) {
        return;
    }

    var settingsManager = new F.manager.Settings({
        run: serviceOptions,
        settings: {
            defaults: {
                name: 'Foobard'
            }
        },
    });
    
    var strategy = settingsManager.getUserRunStrategy({
        allowRunsWithoutSettings: true,
        applySettings: (runService, settings, run)=> {
            let prom = runService.save({ name: settings.name });
            if (settings.Price) {
                prom = prom.then(()=> {
                    runService.variables().save({ Price: +settings.Price });
                });
            }
            return prom.then(()=> {
                return Object.assign({}, run, { name: settings.name });
            });
        }
    });
    
    var rm = new F.manager.RunManager({
        run: serviceOptions,
        strategy: strategy
    });
    rm.getRun(['Price']).then((run)=> {
        $('#curr-run-id').html(run.id);
        $('#run-name').html(run.name);
        $('#price-val').html(run.variables.Price[run.variables.Price.length - 1]);
    }, (e)=> {
        console.error('Run errors', e);
    });
}

init();