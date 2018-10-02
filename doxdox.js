const dd = require('doxdox');
const fs = require('fs');
const _ = require('lodash');
const templateFile = fs.readFileSync('dd-template.ejs', 'utf-8');

const OP_FOLDER = './documentation/generated';
const IP_FOLDER = './src';
const source = [
    {
        sourceFolder: 'service/run-api-service',
        descriptionFile: 'run-api-service.md',
        outputFileName: 'run-api-service.md',
    }
];
source.forEach((src)=> {
    dd.parseFiles([`${IP_FOLDER}/${src.sourceFolder}/index.js`], {
        ignore: '', 
        parser: 'dox', 
        layout: 'ddplugin.js'
    }).then((data)=> {
        const contents = _.template(templateFile)(data[0]);
        const title = src.sourceFolder.split('/').reverse()[0];
        const prologue = [
            '---',
            `title: ${title}`,
            'layout: "default"',
            'isPage: true',
            '---',
        ].join('\n');
        let header = '';
        if (src.descriptionFile) {
            header = fs.readFileSync(`${IP_FOLDER}/${src.sourceFolder}/${src.descriptionFile}`, 'utf-8');
        }
        const dest = `${OP_FOLDER}/${src.outputFileName}`;
        fs.writeFileSync(dest, [prologue, header, contents].join('\n'));
        console.log('Created', dest);
    });
});

