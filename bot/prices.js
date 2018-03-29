"use strict";

const mysql = require('mysql');
const pricing = require('steam-price');
const logging = require('node-my-log');
const config = require('./config.js');

pricing.setup('05cda19ae7f08bbea96e3f24159167');

var con = mysql.createConnection({
	host: config.main_db.host,
	user: config.main_db.user,
	password: config.main_db.pass,
	database: config.main_db.database
});

const log = new logging({
	host: config.main_db.host,
	user: config.main_db.user,
	password: config.main_db.pass,
	database: config.main_db.database,
	table: 'log',
	update: true
});

pricing.getPriceList(config.app, (err, list, count) => {
	for (var i = 0; i <= count; i++) {
		setTimeout(update, 10 * i, list, count, i);
	}
});

var update = (list, count, i) => {
	if (i < count) {
		con.query("INSERT INTO pricing(name, price) VALUES(\"" + list[i].name + "\", " + list[i].price + ") ON DUPLICATE KEY UPDATE price = " + list[i].price + ";", (err) => {
			if (err) {
				console.log(err);
			}
		});
	} else {
		log.debug('Prices updated', '[Prices]');
		setTimeout(process.exit, 1000);
	}

};
