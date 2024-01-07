const path = require("node:path");

module.exports = {
    entry: {
        'GLUtil': [`../glutil.js`],
    },

    output: {
        path:           path.join(__dirname, "../dist"),
        filename:       `[name].min.js`,
        library:        `[name]`,
        libraryTarget:  'var',
    },

}
