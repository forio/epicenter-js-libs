var serviceOptions = getServiceOptions();

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
    applySettings: (runService, settings)=> {
        let prom = runService.save({ name: settings.name });
        if (settings.price) {
            prom = prom.then(()=> {
                runService.variables().save({ Price: settings.price });
            });
        }
        return prom;
    }
});

var rm = new F.manager.Run({
    run: serviceOptions,
    strategy: strategy
});
rm.getRun(['price']).then((run)=> {
    $('#curr-run-id').html(run.id);
    $('#run-name').html(run.name);
    $('#price-val').html(run.variables.price[run.variables.price.length - 1]);
}, (e)=> {
    console.error('Run errors', e);
});