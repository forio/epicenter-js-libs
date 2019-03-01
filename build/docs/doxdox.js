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
        src: 'managers/settings-manager',
        dest: 'settings-manager/index.html.md',
    },
    {
        src: 'managers/settings-manager/settings-service.js',
        dest: 'settings-service/index.html.md',
    },
    {
        src: 'managers/saved-runs-manager',
        dest: 'saved-runs-manager/index.html.md',
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
        includeFiles: [
            'managers/run-strategies/reuse-per-session',  
            'managers/run-strategies/reuse-across-sessions',  
            'managers/run-strategies/reuse-by-tracking-key',  
            'managers/run-strategies/reuse-last-initialized',  
            'managers/run-strategies/reuse-never',  
            'managers/run-strategies/multiplayer-strategy',  
            'managers/run-strategies/use-specific-run-strategy',  
            'managers/run-strategies/none-strategy',  
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

    const includeFiles = (ip.includeFiles || []).map((d)=> `${IP_FOLDER}/${d}.js`);
    return {
        src: `${IP_FOLDER}/${srcFile}`,
        dest: `${OP_FOLDER}/${destFile}`,
        docTitle: ip.title || key,
        headerFile: ip.header || `${IP_FOLDER}/${file}/${key}.md`,
        includeFiles: includeFiles,
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

function getHeaderText(headerFile, includeFiles) {
    if (!headerFile) return Promise.resolve('');
    return new Promise((resolve, reject)=> {
        try {
            const headerText = fs.readFileSync(headerFile, 'utf-8');
            if (!headerText) resolve(headerText);

            const prom = dd.parseFiles(includeFiles, { ignore: '', parser: 'dox', layout: path.resolve(__dirname, 'ddplugin.js') }).then((parsedIncludes)=> {
                // console.log(JSON.stringify(parsedIncludes, 4, 4));
                const parsedHeader = _.template(headerText)({ docs: parsedIncludes });
                return parsedHeader;
            });
            resolve(prom);
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
        
        getHeaderText(ip.headerFile, ip.includeFiles).then((headerData)=> {
            createFile(ip.dest, [prologue, headerData, contents].join('\n'));
        }, (e)=> {
            console.error('Could not get header text', e);
        });
    });
});

