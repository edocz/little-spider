const fs       = require('fs');
const fetchRss = require('../fetchrss');
const filter   = require('../filter');
const crawler  = require('../crawler');
const util     = require('../util');
const Promise  = require('bluebird');
const _        = require('lodash');
const moment   = require('moment');

const SITE_PATH = __dirname + '/../../sites.json';

moment.locale('zh-cn');

let timer = null;

function loadTask() {
	return new Promise(function(resolve, reject) {
		var sites = [];
		var content = fs.readFileSync(SITE_PATH);
		if (util.isValidJson(content)) sites = JSON.parse(content);
		resolve(sites)
	});
}

async function save(news, db) {
	return new Promise(function(resolve, reject) {
		_.each(news.paragraphs, async (para) => {
			await db.content.create({ content: para }).catch((e) => {})
		})

		_.each(news.titles, async (title) => {
			await db.title.create({ title: title }).catch((e) => {})
		})

		news.content = news.content.join('\n');
		news.title = news.titles.join(' ');

		db.article.create(news).then(() => {resolve('done')}).catch((e) => { resolve('done') })
	});
}

function run(db, logger) {
	loadTask().then((sites) => {
		return fetchRss(sites)
	}).each((task) => {
		logger.sender.send('task', { type: 'doing', url: task.title })
		return crawler(task.items).then((news) => {
			return filter(news);
		}).each((news) => {
				return save(news, db);
		}).then(() => {
			logger.sender.send('task', { type: 'done', url: task.title, time: moment().format("MMMDo HH:mm") })
		})
	}).then(() => {
		console.log('all done!')
		timer = setTimeout(() => {
			run(db, logger);
		}, 300000)
	}).catch((e) => {
		console.log(e)
		logger.sender.send('error', e.message)
	})
}

function stop() {
	if (timer) clearTimeout(timer)
}

module.exports = {
	run: run,
	stop: stop
}
