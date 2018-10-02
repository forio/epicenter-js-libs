const dd = require('doxdox');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const templateFile = fs.readFileSync(path.resolve(__dirname, './general-doc-template.ejs'), 'utf-8');

const OP_FOLDER = path.resolve(__dirname, '../../documentation/generated');
const IP_FOLDER = path.resolve(__dirname, '../../src');
const files = [
    // 'service/run-api-service',
    // 'service/data-api-service',
    'service/password-api-service',
];
/**
 * Assumes following input folder structure
 *  service/run-api-service
 *      index.js
 *      run-api-service.md (optional)
 *  Creates run-api-service/index.html.md
 */
files.forEach((file)=> {
    dd.parseFiles([`${IP_FOLDER}/${file}/index.js`], {
        ignore: '', 
        parser: 'dox', 
        layout: path.resolve(__dirname, 'ddplugin.js')
    }).then((data)=> {
        const contents = _.template(templateFile)(data[0]);
        const key = file.split('/').reverse()[0];
        const prologue = [
            '---',
            `title: ${key}`,
            'layout: "default"',
            'isPage: true',
            '---',
        ].join('\n');
        let header = '';
        try {
            header = fs.readFileSync(`${IP_FOLDER}/${file}/${key}.md`, 'utf-8');
        } catch (e) {
            console.log('No description file found for', file);
        }

        const dest = `${OP_FOLDER}/${key}/index.html.md`;
        fs.writeFileSync(dest, [prologue, header, contents].join('\n'));
        console.log('Created', dest);
    });
});

