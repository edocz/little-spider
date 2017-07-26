'use strict';

const cheerio = require('cheerio');
const rp      = require('request-promise');
const fs      = require("fs");
const iconv   = require('iconv-lite');
const Promise = require('bluebird');

var getData = function(item){
	return new Promise(function(resolve, reject) {
		rp({
			uri: item.link,
			encoding: null,
			transform: (body, response) => {
				if (!(/^2/.test('' + response.statusCode))) {
					item['content'] = [];
					return resolve(item)
				}
				var charset = 'utf-8';
				if (response.headers['content-type'].indexOf('charset=') !== -1) {
					var result = response.headers['content-type'].split('charset=')[1].split(';')[0];
					if (result != null) charset = result.toLowerCase();
				} else {
					var matched = body.toString().match(/<meta.*charset="?([a-z0-9-]+)".*/i);
					if (matched !== null) {
						charset = matched[1];
					}
				}
				return cheerio.load(iconv.decode(body, charset), {decodeEntities: false});
			}
		}).then(($) => {
			var content = [];
			$('div,section').has('p').each(function(){
				var $parent = $(this);
				var $items = $parent.children('p');
				if($items.length>content.length){
					content = $items.map(function(i, item){
						var value = $(item).text().trim();
						if(value){
								return value;
						}
					}).toArray();
				}else if($items.length==content.length){
					var temp = $items.map(function(i, item){
						var value = $(item).text().trim();
						if(value){
								return value;
						}
					}).toArray();
					if(temp.join('').length>content.join('').length){
						content = temp;
					}
				}
			});
			$ = null;
			if (content.length == 0) {
				item['content'] = [];
				resolve(item)
			}
			var last = content[content.length-1];
			if(last && last.indexOf('：')>-1){
				content.pop();
			}
			item['content'] = content;
			resolve(item);
		}).catch(function (error) {
			item['content'] = [];
			resolve(item)
		});
	});
};

module.exports = function(items){
  return new Promise(function(resolve,reject){
		Promise.mapSeries(items, function (item) {
			return getData(item);
		}).then(function (results) {
			resolve(results)
		})
  });
};
