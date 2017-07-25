const fs = require('fs');
const path = require('path');
const util = require('../util');

const CONFIG_PATH = __dirname + '/../../config.json';

let content = fs.readFileSync(CONFIG_PATH);
let config = {}

if (util.isValidJson(content)) config = JSON.parse(content)

console.log(config)
