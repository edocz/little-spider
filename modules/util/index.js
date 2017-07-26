const fs = require('fs');
const _  = require('lodash');

const CONFIG_PATH = __dirname + '/../../config.json';
const SITE_PATH = __dirname + '/../../sites.json';

/** 工具类函数 **/
function isValidJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function loadConfig() {
	var content = fs.readFileSync(CONFIG_PATH);
	if (isValidJson(content)) return JSON.parse(content);
	return {}
}

function saveConfig(config) {
	if (config) fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, undefined, 2))
}

function loadSites() {
	var content = fs.readFileSync(SITE_PATH)
	if (isValidJson(content)) return JSON.parse(content)
	return [];
}

function saveSites(content, sites) {
	_.each(content.split('\n'), (line) => {
		if (!line) return;
		var site = {}
		// site.type = 'rss';
		// site.cycle= 300;
		site.url = line;
		site.title = line;
		sites.push(site);
	});
	sites = _.uniqBy(sites, 'url')
	fs.writeFileSync(SITE_PATH, JSON.stringify(sites, undefined, 2))
	return sites;
}

module.exports = {
	isValidJson: isValidJson,
	loadConfig: loadConfig,
	saveConfig: saveConfig,
	loadSites: loadSites,
	saveSites: saveSites
}
