const fs   = require('fs');
const util = require('../util');
const _    = require('lodash');

const EXCLUDE_PATH = __dirname + '/../../word-exclude.txt';
const REPLACE_PATH = __dirname + '/../../word-replace.txt';
const INCLUDE_PATH = __dirname + '/../../word-include.txt';

let content = ''
let config = util.loadConfig();

content = fs.readFileSync(INCLUDE_PATH).toString();
config['include'] = content.split('\n').filter((line) => { if (line) return line });

content = fs.readFileSync(EXCLUDE_PATH).toString();
config['exclude'] = content.split('\n').filter((line) => { if (line) return line });

content = fs.readFileSync(REPLACE_PATH).toString();
config['replace'] = content.split('\n').map((line) => {
	if (line) {
		var spline = line.split('\t');
		if (spline.length == 2) return spline
	}
}).filter((rp) => { if (rp) return rp });

module.exports = function (records) {
	var results = []
	return new Promise(function(resolve, reject) {
		if (!records || records.length == 0) resolve([])
		_.each(records, (news) => {
			if (!news.content || !news.title) return null;
			var str = news.content.join('-_-!');
			for(var i in config['exclude']) {
				var exclude = config['exclude'][i];
				if (news.title.indexOf(exclude) !== -1 || str.indexOf(exclude) !== -1) resolve([])
			}

			for(var i in config['include']) {
				var include = config['include'][i];
				if (news.title.indexOf(include) === -1 && str.indexOf(include) === -1) resolve([])
			}

			for(var i in config['replace']) {
				var rpl = config['replace'][i];
				var reg = new RegExp(rpl[0], 'g');
				news.title = news.title.replace(reg, rpl[1])
				str = str.replace(reg, rpl[1])
			}

			var titles = []
			_.each(news.title.split(' '), (title) => {
				if (title.length < parseInt(config['title-max']) && title.length > parseInt(config['title-min'])) titles.push(title)
			})

			var pars = str.split('-_-!').filter((par) => {
				if (par.length < parseInt(config['content-max']) && par.length > parseInt(config['content-min'])) {
					return par
				}
			})
			var result = Object.assign({}, news, {
				titles: titles,
				paragraphs: pars
			});
			results.push(result);
		})
		resolve(results);
	});
}
