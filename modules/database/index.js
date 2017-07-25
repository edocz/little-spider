const Sequelize = require('sequelize');
const fs        = require('fs');
const path      = require('path');

let sequelize   = null;
let CONNECTED   = false;
let MODEL_PATH  = __dirname + '/models/'

var exports = {
	connect: connect,
	disconnect: disconnect,
	sequelize: sequelize
}

function connect(config) {
	exports.sequelize = new Sequelize(config.database, config.username, config.password, {
		host: config.host,
		port: parseInt(config.port),
		dialect: 'mysql',
		logging: false,
		define: {
			timestamps: true
		},
		pool: {
			max: 5,
			min: 0,
			idle: 10000
		}
	});

	var files = fs.readdirSync(MODEL_PATH);

	files.forEach((filename) => {
		var fullname = path.join(MODEL_PATH, filename);
		var stats = fs.statSync(fullname);
		if (stats.isDirectory()) return;
		var tablename = filename.replace('.js', '');
		exports[tablename] = exports.sequelize.import(MODEL_PATH + filename);
		exports[tablename].sync()
	});
}

function disconnect() {
	exports.sequelize.close()
}

module.exports = exports;
