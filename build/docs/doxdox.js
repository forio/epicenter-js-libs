const dd = require('doxdox');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const files = [
    'service/timer-service',
    'service/run-api-service',
    'service/data-api-service',
    'service/password-api-service',

    'service/run-api-service/variables-api-service.js',
    
    'service/asset-api-adapter',
    'service/state-api-adapter',
    'service/introspection-api-service',
    
    'service/presence-api-service',
    'service/member-api-adapter',
    'service/user-api-adapter',
    'service/world-api-adapter',

    'managers/scenario-manager',

    {
        src: 'managers/settings-manager/index.js',
        dest: 'settings-manager/index.html.md',
    },
    {
        src: 'managers/settings-manager/settings-service.js',
        dest: 'settings-service/index.html.md',
    },
    {
        src: 'managers/scenario-manager/saved-runs-manager/index.js',
        dest: 'scenario-manager/saved/index.html.md',
    },
    {
        src: 'managers/scenario-manager/scenario-strategies/baseline-strategy.js',
        dest: 'scenario-manager/baseline/index.html.md',
    },
    {
        src: 'managers/scenario-manager/scenario-strategies/reuse-last-unsaved.js',
        dest: 'scenario-manager/current/index.html.md',
    },

    {
        src: 'service/consensus-api-service/consensus-group-service.js',
        dest: 'consensus/consensus-group-service/index.html.md',
    },
    {
        src: 'service/consensus-api-service/consensus-service.js',
        dest: 'consensus/consensus-service/index.html.md',
    },
    {
        src: 'managers/epicenter-channel-manager',
        dest: 'channels/epicenter-channel-manager/index.html.md',
    },
    {
        src: 'service/channel-service',
        dest: 'channels/channel-service/index.html.md',
    },
    {
        src: 'managers/epicenter-channel-manager/channel-manager',
        dest: 'channels/channel-manager/index.html.md',
    },
    {
        src: 'managers/run-strategies',
        include: [
            'managers/run-strategies/multiplayer-strategy',  
            'managers/run-strategies/reuse-across-sessions',  
        ],
        dest: 'run-strategies/index.html.md',
    },
    {
        src: 'managers/auth-manager',
        dest: 'auth/auth-manager/index.html.md',
    },
    {
        src: 'service/auth-api-service',
        dest: 'auth/auth-service/index.html.md',
    },
    
    'managers/world-manager',
    'managers/user-manager',
    
    'managers/run-manager',
];
/**
 * Assumes following input folder structure
 *  service/run-api-service
 *      index.js
 *      run-api-service.md (optional)
 *  Creates run-api-service/index.html.md
 */

const defaultDocTemplate = fs.readFileSync(path.resolve(__dirname, './general-doc-template.ejs'), 'utf-8');
const OP_FOLDER = path.resolve(__dirname, '../../documentation/generated');
const IP_FOLDER = path.resolve(__dirname, '../../src');

function normalizeInputStructure(ip) {
    const file = ip.src || ip;
    const key = file.split('/').reverse()[0].replace('.js', '');
    const srcFile = file.indexOf('.js') === -1 ? `${file}/index.js` : file;
    const destFile = ip.dest || `${key}/index.html.md`;

    return {
        src: `${IP_FOLDER}/${srcFile}`,
        dest: `${OP_FOLDER}/${destFile}`,
        docTitle: ip.title || key,
        headerFile: ip.header || `${IP_FOLDER}/${file}/${key}.md`,
        includes: ip.includes || [],
        template: ip.template || defaultDocTemplate,
    };
}
function createFile(dest, contents) {
    const spilt = dest.split('/');
    const fileName = spilt.pop();
    try {
        fs.mkdirSync(spilt.join('/'), { recursive: true });
    } catch (e) {
        //folder alerady exists, and that's okay
    }
    fs.writeFileSync(dest, contents);
    console.log(`Created ${dest}`);
}

function getHeaderText(headerFile, includes) {
    if (!headerFile) return Promise.resolve('');
    return new Promise((resolve, reject)=> {
        let header = '';
        try {
            const headerContents = fs.readFileSync(headerFile, 'utf-8');
            // parseFiles(ip).
            header = _.template(headerContents)({ data: includes });
            resolve(header);
        } catch (e) {
            resolve('');
        }
    });
}

files.map(normalizeInputStructure).forEach((ip)=> {
    dd.parseFiles([ip.src], {
        ignore: '', 
        parser: 'dox', 
        layout: path.resolve(__dirname, 'ddplugin.js')
    }).then((data)=> {
        const contents = _.template(ip.template)(data[0]);
        const prologue = [
            '---',
            `title: ${ip.docTitle}`,
            'layout: "jslib"',
            'isPage: true',
            '---',
        ].join('\n');
        
        getHeaderText(ip.headerFile, ip.includes).then((headerData)=> {
            createFile(ip.dest, [prologue, headerData, contents].join('\n'));
        }, (e)=> {
            console.error('Could not get header text', e);
        });
    });
});

