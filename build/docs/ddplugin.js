const fs = require('fs');

//FIXME: This should really be pulling this from typedefs, but current parser we use doesn't recognize typedefs
const generalOptions = [
    {
        name: 'token',
        isOptional: true,
        types: ['string'],
        description: 'For projects that require authentication, pass in the user access token (defaults to undefined). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)). @see [Authentication API Service](../auth-api-service/) for getting tokens.'
    },
    {
        name: 'transport',
        isOptional: true,
        types: ['[JQueryAjaxOptions](http://api.jquery.com/jQuery.ajax)'],
        description: 'Options to pass on to the underlying transport layer. All jquery.ajax options are supported.'
    }
];
const accountOptions = [].concat([
    {
        name: 'account',
        isOptional: false,
        types: ['string'],
        description: 'The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to undefined. If left undefined, taken from the URL.'
    },
    {
        name: 'project',
        isOptional: false,
        types: ['string'],
        description: 'The project id. Defaults to undefined. If left undefined, parsed from the URL.',
    }
], generalOptions);

const typedefs = {
    ServiceOptions: generalOptions,
    AccountAPIServiceOptions: accountOptions
};

function paramsToTable(params) {
    if (!params || !params.length) {
        return 'None';
    }

    const toRow = (arr)=> `|${arr.join('|')}|`;
    const headers = ['Required?', 'Name', 'Type', 'Description'];
    const paramRows = params.map((param)=> {
        const isOptional = param.isOptional || param.name.indexOf('[') === 0;
        const name = param.name.replace('[', '').replace(']', '');
        const type = param.types && param.types.length ? param.types.join(', ') : 'any';
        return toRow([
            isOptional ? '' : '•',
            name,
            type.indexOf('http') === -1 ? `\`${type}\`` : type,
            param.description, 
        ]);
    });
    const tbl = [
        toRow(headers),
        toRow(headers.map(()=> '------')),
        ...paramRows
    ].join('\n');
    return tbl;
}

const plugin = (data)=> new Promise((resolve, reject)=> {
    fs.writeFileSync('output-orig.json', JSON.stringify(data, null, 2));

    const parsedFiles = data.files.map((file)=> {
        const pathParams = file.name.split('/');
        const relevantModuleName = pathParams[pathParams.length - 2]; //last item is index.js

        file.name = relevantModuleName;
        
        const splitMethodsAndConfig = file.methods.reduce((accum, m)=> {
            const typeKey = `type_${m.type}`;
            accum[typeKey] = (accum[typeKey] || []).concat(m);
            return accum;
        }, {});

        splitMethodsAndConfig.methods = splitMethodsAndConfig.type_method.map((m)=> {
            m.tags.example = m.tags.example.map((r)=> r.trim());
            m.parameterTable = paramsToTable(m.tags.param);

            const ret = m.tags.return[0];
            m.returns = {
                type: ret && ret.types && ret.types[0],
                description: (ret && ret.description) ? `- ${ret.description}` : ''
            };
            return m;
        });

        const mainDescEl = splitMethodsAndConfig.type_class || splitMethodsAndConfig.type_function;
        file.description = mainDescEl && mainDescEl[0].description;

        const constructorOptions = splitMethodsAndConfig.type_constructor || splitMethodsAndConfig.type_function;
        file.constructorOptionsTable = '';
        if (constructorOptions) {
            const co = constructorOptions[0];
            const type = co.tags.param[0].types[0];
            if (typedefs[type]) {
                co.tags.property = [].concat(co.tags.property, typedefs[type]);
            }
            file.constructorOptionsTable = paramsToTable(co.tags.property);
        }

        return Object.assign(file, splitMethodsAndConfig);
    });
    resolve(parsedFiles);
});

module.exports = plugin;
