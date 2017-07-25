'use strict';

const FeedParser = require('feedparser');
const request    = require('request');
const Iconv      = require('iconv-lite');

const reg           = /\/\/$/;
const defaultFields = ['title', 'link', 'pubDate'];

/**
 * translate response content to utf-8
 * @param res
 * @param charset
 * @returns content
 */
function maybeTranslate (res, charset) {
	var iconv;
	// Use iconv if its not utf8 already.
	if (!iconv && charset && !/utf-*8/i.test(charset)) {
		try {
			iconv = new Iconv(charset, 'utf-8');
			console.log('Converting from charset %s to utf-8', charset);
			iconv.on('error', done);
			// If we're using iconv, stream will be the output of iconv
			// otherwise it will remain the output of request
			res = res.pipe(iconv);
		} catch(err) {
			res.emit('error', err);
		}
	}
	return res;
}

/**
 * get encoding by response header content-type
 * @param str
 * @returns encoding
 */
function getParams(str) {
	var params = str.split(';').reduce(function (params, param) {
		var parts = param.split('=').map(function (part) { return part.trim(); });
		if (parts.length === 2) {
			params[parts[0]] = parts[1];
		}
		return params;
	}, {});
	return params;
}

/**
 * get all post info by rss url
 * @param item {url:url, title: title}
 * @param fields
 * @returns {Promise}
 */
function fetchRss(item, fields) {
	fields = fields || defaultFields;

	return new Promise(function(resolve, reject) {

		var posts = [];

		var req = request(item.url, {
			timeout: 20000,
			pool: false
		});

		var feedparser = new FeedParser();

		req.setMaxListeners(50);

		req.setHeader('user-agent',
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36'
		);

		req.setHeader('accept', 'text/html,application/xhtml+xml');

		req.on('error', function (err) {
			return resolve({items: []})
		});

		req.on('response', function(res) {
			if (res.statusCode !== 200 && res.statusCode !== 304) {
				return resolve({items: []})
			}
			var charset = getParams(res.headers['content-type'] || '').charset;
			res = maybeTranslate(res, charset);
			res.pipe(feedparser);
		});

		feedparser.on('error', function (err) {
			return resolve({items: []})
		});

		feedparser.on('end', function(err) {
			if (err) {
				return resolve({});
			}

			resolve({ title:item.title, items:posts });
		});

		feedparser.on('readable', function() {
			var stream = this
			    , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
				, post;

			while (post = this.read()) {
				var item = {};
				fields.forEach(function (field) {
					item[field] = post[field] ? post[field].toString() : ''
					if (field === 'link') {
						item.link = item.link.replace(reg, '');
					}
				});
				posts.push(item);
			}
		});
	});
}


/**
 * get all post info by rss urls
 * @param config
 * @param options
 * @returns {Promise}
 */

module.exports = function (items, fields) {
	return new Promise(function(resolve, reject) {
		var promises = items.map(function (item) {
			return fetchRss(item, fields);
		});

		Promise.all(promises).then(function (results) {
			resolve(results);
		}).catch(function(reason){
			reject(reason);
		});
	});
}
