const fs       = require('fs');
const fetchRss = require('../fetchrss');
const filter   = require('../filter');
const crawler  = require('../crawler');
const util     = require('../util');
const Promise  = require('bluebird');
const _        = require('lodash');
const moment   = require('moment');

moment.locale('zh-cn');

let timer = null;
let RUNNING = true;
var config = util.loadConfig()

function loadTask() {
	return new Promise(function(resolve, reject) {
		var sites = util.loadSites();
		if (config.current) {
			var idx = _.findIndex(sites, (o) => { return o.url == config.current; });
			sites = _.slice(sites, idx)
		}
		resolve(sites)
	});
}

function save(news, db) {
	return new Promise(function(resolve, reject) {
		_.each(news.paragraphs, async (para) => {
			await db.content.findOrCreate({where: {content: para}, defaults: {content: para}}).catch((e) => { console.log(e.message) })
		})

		_.each(news.titles, async (title) => {
			await db.title.findOrCreate({where: {title: title}, defaults: {title: title}}).catch((e) => { console.log(e.message) })
			// await db.title.create({ title: title }).catch((e) => { console.log(e) })
		})

		news.content = news.content.join('\n');
		news.title = news.titles.join(' ');

		db.article.findOrCreate({where: {link: news.link}, defaults: news})
			.spread((article, created) => {
				resolve('done')
			}).catch((e) => { console.log(e.message) })
		// db.article.create(news).then(() => { resolve('done') }).catch((e) => { console.log(e.message) })
	});
}

function run(db, logger) {
	if (!RUNNING) return;
	loadTask().then((sites) => {
		return fetchRss(sites)
	}).each((task) => {
		config.current = task.title;
		util.saveConfig(config)
		logger.sender.send('task', { type: 'doing', url: task.title })
		return crawler(task.items).then((news) => {
			return filter(news);
		}).each((news) => {
				return save(news, db).catch((e) => {
					console.log(e)
					logger.sender.send('error', e.message)
				});
		}).then(() => {
			logger.sender.send('task', { type: 'done', url: task.title, time: moment().format("MMMDo HH:mm") })
		})
	}).then(() => {
		config.current = '';
		util.saveConfig(config)
		timer = setTimeout(() => {
			run(db, logger);
		}, config['app-sleep'] * 1000)
	}).catch((e) => {
		logger.sender.send('error', e.message)
	})
}

function stop() {
	RUNNING = false
	if (timer) clearTimeout(timer)
}

module.exports = {
	run: run,
	stop: stop
}
