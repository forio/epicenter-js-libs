function init() {
    var am = new F.manager.AuthManager();
    if (!am.isLoggedIn()) {
        alert('Not logged in');
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
        multiplayer: true,
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
    function renderRunResults() {
        settingsManager.getRuns([], { saved: false }, { endRecord: 3 }).then((runs)=> {
            const markup = runs.map((run)=> {
                return `
                    <tr>
                        <td>${run.user.userName}</td>
                        <td>${run.id}</td>
                        <td>${JSON.stringify(run.settings)}</td>
                    </tr>
                `;
            });
            $('#run-results tbody').html(markup.join(''));
        });
    }

    $('#btn-new-run').on('click', ()=> {
        settingsManager.settings.updateActive({ isOpen: 0 }).then(()=> {
            settingsManager.settings.createDraft().then((settings)=> {
                alert('Draft created');
                updateUIWithSettings(settings);
            });
        });
    });
    $('#btn-save-settings').on('click', ()=> {
        settingsManager.settings.saveAndActivate().then((settings)=> {
            alert('Activated');
            renderRunResults();
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
    $('#btn-refresh-run-results').on('click', ()=> {
        renderRunResults();
    });

    $('input, select').on('change', (evt)=> {
        const $el = $(evt.target);
        const params = {
            [$el.attr('name')]: $el.val()
        };
        settingsManager.settings.updateDraft(params);
    });

    initializeUI();
    renderRunResults();
}

init();