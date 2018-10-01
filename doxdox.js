const dd = require('doxdox');
const fs = require('fs');
const _ = require('lodash');
const templateFile = fs.readFileSync('dd-template.ejs', 'utf-8');

dd.parseFiles(['./src/service/run-api-service/index.js'], {
    ignore: '', 
    parser: 'dox', 
    layout: 'ddplugin.js'
}).then((data)=> {
    const templated = _.template(templateFile)(data[0]);
    fs.writeFileSync('output.md', templated);
});
