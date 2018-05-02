/**
 * List of tests to be required
 */

var srcContext = require.context('../src/', true, /tests\/test-(.*)\.js$/i);
srcContext.keys().forEach((key)=> {
    srcContext(key);
});