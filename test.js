// const fs = require('fs');
//
// var config = [{"type":"html","name":"baidu","cycle":5,"link":"http://news.baidu.com","title":"$('h1').text()","content":"$('p').text()"}]
//
// fs.writeFileSync('config.json', JSON.stringify(config));
//
//
const util = require('./modules/util');
const fs = require('fs');
const CONFIG_PATH  = __dirname + '/config.json';

let content = fs.readFileSync(CONFIG_PATH);
let config = {}

if (util.isValidJson(content)) config = JSON.parse(content)

const db    = require('./modules/database')

db.connect(config)

const worker = require('./modules/worker');

worker.run(db)
