const fs       = require('fs');
const fetchRss = require('../fetchrss');
const filter   = require('../filter');
const crawler  = require('../crawler');
const util     = require('../util');
const Promise  = require('bluebird');

const SITE_PATH = __dirname + '/../../sites.json';

let jobs = []

function loadTask() {
	return new Promise(function(resolve, reject) {
		var sites = [];
		var content = fs.readFileSync(SITE_PATH);
		if (util.isValidJson(content)) sites = JSON.parse(content);
		resolve(sites)
	});
}

function run() {
	loadTask().then((sites) => {
		return fetchRss(sites)
	}).each((task) => {
		return crawler(task.items).then((news) => {
			return filter(news);
		}).then((news) => {
			save(news);
		})
	}).then((result) => {
		console.log(result)
		// return filter(result)
	})
	// }).then((result) => {
	// 	console.log(result);
	// });
}

module.exports = {
	run: run
}
