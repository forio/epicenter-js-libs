const fs = require('fs');
const path = require('path');

function paramsToTable(params) {
    if (!params || !params.length) {
        return '';
    }

    const toRow = (arr)=> `|${arr.join('|')}|`;
    const headers = ['Required?', 'Name', 'Type', 'Description'];
    const paramRows = params.map((param)=> {
        return toRow([
            param.isOptional ? '' : '•',
            param.name,
            param.types.length ? param.types.join(', ') : 'any',
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
    const parsedFiles = data.files.map((file)=> {
        const pathParams = file.name.split('/');
        const relevantModuleName = pathParams[pathParams.length - 2]; //last item is index.js

        file.name = relevantModuleName;
        const splitMethodsAndConfig = file.methods.reduce((accum, m)=> {
            accum[m.type] = (accum[m.type] || []).concat(m);
            return accum;
        }, {});
        splitMethodsAndConfig.methods = splitMethodsAndConfig.method.map((m)=> {
            m.tags.example = m.tags.example.map((r)=> r.trim());
            m.parameterTable = paramsToTable(m.tags.param);
            return m;
        });
        return Object.assign(file, splitMethodsAndConfig);
    });
    resolve(parsedFiles);
});

module.exports = plugin;
