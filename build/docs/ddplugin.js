const fs = require('fs');

//FIXME: This should really be pulling this from typedefs, but current parser we use doesn't recognize typedefs
const generalOptions = [
    {
        name: 'token',
        isOptional: true,
        types: ['string'],
        description: 'For projects that require authentication, pass in the user access token (defaults to undefined). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)). @see [Authentication API Service](../auth/auth-service/) for getting tokens.'
    },
    {
        name: 'transport',
        isOptional: true,
        types: ['[JQueryAjaxOptions](http://api.jquery.com/jQuery.ajax)'],
        description: 'Options to pass on to the underlying transport layer. All jquery.ajax options are supported.'
    },
    {
        name: 'server',
        isOptional: true,
        types: ['object'],
        description: '',
    },
    {
        name: 'server.host',
        isOptional: true,
        types: ['string'],
        description: 'The value of `host` is usually the string `api.forio.com`, the URI of the Forio API server. This is automatically set, but you can pass it explicitly if desired. It is most commonly used for clarity when you are [hosting an Epicenter project on your own server](../../../how_to/self_hosting/)'
    },
    {
        name: 'server.protocol',
        isOptional: true,
        types: ['https', 'http'],
        description: 'Defaults to https',
    }
];
const accountOptions = [].concat([
    {
        name: 'account',
        isOptional: true,
        types: ['string'],
        description: 'The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to undefined. If left undefined, taken from the URL.'
    },
    {
        name: 'project',
        isOptional: true,
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
        const type = param.types && param.types.length ? param.types.map((t)=> (typeof t === 'object' ? JSON.stringify(t) : t)).join(' / ') : 'any';
        if (type === '[object Object]') {
            console.error('Documentation error, unknown type', param.types);
        }
        return toRow([
            isOptional ? '&nbsp;' : 'Yes',
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
    // fs.writeFileSync('output-raw.json', JSON.stringify(data, null, 2));

    const parsedFiles = data.files.map((file)=> {
        const pathParams = file.name.split('/');
        const moduleNameIndex = file.name.indexOf('index') === -1 ? 1 : 2;
        const relevantModuleName = pathParams[pathParams.length - moduleNameIndex];

        file.name = relevantModuleName.split('.')[0];
        
        const splitMethodsAndConfig = file.methods.reduce((accum, m)=> {
            const typeKey = `type_${m.type}`;
            accum[typeKey] = (accum[typeKey] || []).concat(m);
            return accum;
        }, {});

        splitMethodsAndConfig.methods = (splitMethodsAndConfig.type_method || []).map((m)=> {
            m.tags.example = m.tags.example.map((r)=> r.trim());
            m.parameterTable = paramsToTable(m.tags.param);
            m.name = m.name.split('.').reverse()[0];
            const ret = m.tags.return[0];
            m.returns = {
                type: ret && ret.types && ret.types[0],
                description: (ret && ret.description) ? `- ${ret.description}` : ''
            };
            return m;
        });

        const mainDescEl = splitMethodsAndConfig.type_class || splitMethodsAndConfig.type_function;
        file.description = mainDescEl && mainDescEl[0].description;

        const constructorOptions = splitMethodsAndConfig.type_constructor || splitMethodsAndConfig.type_function || splitMethodsAndConfig.type_method;
        file.constructorOptionsTable = '';
        if (constructorOptions) {
            const co = constructorOptions[0];
            const type = co.tags.param[0] && co.tags.param[0].types[0];
            if (typedefs[type]) {
                co.tags.property = [].concat(co.tags.property, typedefs[type]);
            }
            file.constructorOptionsTable = co.tags.property.length ? paramsToTable(co.tags.property) : co.parameterTable;
        }

        return Object.assign(file, splitMethodsAndConfig);
    });
    resolve(parsedFiles);
});

module.exports = plugin;
