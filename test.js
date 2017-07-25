// const fs = require('fs');
//
// var config = [{"type":"html","name":"baidu","cycle":5,"link":"http://news.baidu.com","title":"$('h1').text()","content":"$('p').text()"}]
//
// fs.writeFileSync('config.json', JSON.stringify(config));
//
const worker = require('./modules/worker');

worker.run()
