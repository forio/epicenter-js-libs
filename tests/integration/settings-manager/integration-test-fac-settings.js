function init() {
    var am = new F.manager.AuthManager();
    if (!am.isLoggedIn()) {
        return;
    }

    var serviceOptions = getServiceOptions();
    var rm = new F.manager.RunManager({
        run: serviceOptions,
        strategy: 'reuse-across-sessions'
    });

    var settingsManager = new F.manager.Settings({
        run: serviceOptions,
        settings: {
            defaults: ()=> {
                return rm.getRun(['Price']).then((run)=> {
                    return {
                        name: '',
                        Price: run.variables.Price[run.variables.Price.length - 1]
                    };
                });
            }
        },
        allowRunsWithoutSettings: true,
    });


    function updateUIWithSettings(settings) {
        $('#txt-run-name').val(settings.name);
        $('#txt-price').val(settings.Price);
        $('#lst-run-limit').val(settings.runLimit || '');
        if (!settings.isDraft) {
            $('input, select, button:not(#btn-new-run):not(#btn-delete-all)').attr('disabled', true);
            $('#btn-new-run').removeAttr('disabled');
        } else {
            $('#btn-new-run').attr('disabled', true);
            $('input, select, button:not(#btn-new-run)').removeAttr('disabled');
        }
    }
    function initializeUI() {
        settingsManager.settings.getMostRecent().then((settings)=> {
            updateUIWithSettings(settings);
        }, (e)=> {
            console.error('Run errors', e);
        });
    }

    $('#btn-new-run').on('click', ()=> {
        settingsManager.settings.createDraft().then((settings)=> {
            alert('Draft created');
            updateUIWithSettings(settings);
        });
    });
    $('#btn-save-settings').on('click', ()=> {
        settingsManager.settings.saveAndActivate().then((settings)=> {
            alert('Activated');
            updateUIWithSettings(settings);
        });
    });
    $('#btn-reset').on('click', ()=> {
        rm.reset().then(()=> {
            settingsManager.settings.resetDraft().then((settings)=> {
                updateUIWithSettings(settings);
            });
        });
    });
    $('#btn-delete-all').on('click', ()=> {
        settingsManager.settings.ds.remove().then(initializeUI);
    });

    $('input, select').on('change', (evt)=> {
        const $el = $(evt.target);
        const params = {
            [$el.attr('name')]: $el.val()
        };
        settingsManager.settings.updateDraft(params);
    });

    initializeUI();
}

init();