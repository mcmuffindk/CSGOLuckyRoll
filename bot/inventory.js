"use strict";

const logging = require('node-my-log');
const express = require('express');
const cors = require('cors');
const refresh = express();
const fs = require('fs');
const https = require('https');
const url = require('url');
const mysql = require('mysql');
const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');
const config = require('./config');

const corsOptions = {
	origin: config.domain,
	optionsSuccessStatus: 200
};

const log = new logging({
	host: config.main_db.host,
	user: config.main_db.user,
	password: config.main_db.pass,
	database: config.main_db.database,
	table: 'log',
	update: true
});
const client = new SteamUser();
const community = new SteamCommunity();
const manager = new TradeOfferManager({
	steam: client,
	community: community,
	language: config.steam.language,
	cancelTime: config.steam.cancelTime,
	pollInterval: config.steam.pollInterval
});

var httpsOptions = {
	key: fs.readFileSync(config.SSL.key),
	cert: fs.readFileSync(config.SSL.cert),
};

var steamLogOn = {
	accountName: config.steam.user,
	password: config.steam.pass,
	twoFactorCode: SteamTotp.generateAuthCode(config.steam.shared) //shared_secret
};

var db_main = mysql.createConnection({
	host: config.main_db.host,
	user: config.main_db.user,
	password: config.main_db.pass,
	database: config.main_db.database
});

var db_inventorys = mysql.createConnection({
	host: config.inventory_db.host,
	user: config.inventory_db.user,
	password: config.inventory_db.pass,
	database: config.inventory_db.database
});

log.info('[MySQL] Connecting..', '[Combined]');

db_inventorys.connect((err) => {
	if (err) {
		log.error(JSON.stringify(err).replace(/\'/g, '\\\''), '[Combined]');
	} else {
		log.info('[MySQL] ' + config.inventory_db.database + ' connected..', '[Combined]');
		db_main.connect((err) => {
			if (err) {
				log.error(JSON.stringify(err).replace(/\'/g, '\\\''), '[Combined]');
			} else {
				log.info('[MySQL] ' + config.main_db.database + ' connected..', '[Combined]');
				log.info('[MySQL] Connected', '[Combined]');
				steamLogin();
			}
		});
	}
});

var steamLogin = () => {
	log.info('[Steam] Logging in..', '[Combined]');

	client.logOn(steamLogOn);

	client.on('loggedOn', () => {
		log.info('[Steam] Logged in', '[Combined]');
		cookies();
	});
};

var cookies = () => {
	client.on('webSession', (sessionid, cookies) => {
		manager.setCookies(cookies);
		community.setCookies(cookies);
	});
};

const Refresh = https.createServer(httpsOptions, refresh);

Refresh.listen(config.port.inventory);

// inventory refresh

refresh.get('/', cors(corsOptions), (req, res) => {

	log.debug('New request on port ' + config.port.inventory, '[Combined]');

	var response;

	var end = (callback) => {

		var response = JSON.stringify(callback);

		res.writeHead(200, {
			'Access-Control-Allow-Origin': config.domain,
			'Content-Type': 'application/json'
		});
		res.end(response);
	};

	var update = (i, inventory) => {
		if (i < inventory.length) {
			var name = "'" + inventory[i].market_hash_name + "'";
			var image = "'" + inventory[i].icon_url + "'";
			var assetid = "'" + inventory[i].assetid + "'";
			var sql = "INSERT INTO `inventorys`.`" + qdata + "` (name, assetid, icon_url) VALUES (" + name + ", " + assetid + ", " + image + ")";

			db_inventorys.query(sql, (err) => {
				if (err) {
					response = {
						status: 'error',
						msg: 'Could not update inventory'
					};
					end(response);
				}
			});
		} else {
			response = {
				status: 'success',
				msg: 'Inventory updated'
			};
			end(response);
		}
	};

	var q = url.parse(req.url, true);
	var qdata = q.query.id;

	db_inventorys.query("DROP TABLE `inventorys`.`" + qdata + "`", (err) => {
		if (err) {
			log.error(JSON.stringify(err).replace(/\'/g, '\\\''), '[Combined]');
		}
	});

	setTimeout(() => {

		db_inventorys.query("CREATE TABLE `inventorys`.`" + qdata + "` ( `id` INT NOT NULL AUTO_INCREMENT , `name` VARCHAR(255) NOT NULL , `assetid` BIGINT NOT NULL , `icon_url` VARCHAR(255) NOT NULL , PRIMARY KEY (`id`)) ENGINE = InnoDB;", (err) => {
			if (err) {
				response = {
					status: 'error',
					msg: 'Could not update inventory'
				};
				end(response);
			} else {
				var trade_url;

				db_main.query("SELECT t_url FROM users WHERE s_id = " + qdata, (err, result) => {
					if (err) {
						response = {
							status: 'error',
							msg: 'Could not update inventory'
						};
						end(response);
					} else {
						if (result.length > 0) {
							trade_url = result[0].t_url;

							if (!trade_url) {
								response = {
									status: 'error',
									msg: 'Could not update inventory, please set your trade link'
								};
								end(response);
							} else {
								const offer = manager.createOffer(trade_url);

								offer.getPartnerInventoryContents(730, 2, (err, inventory) => {
									if (err) {
										response = {
											status: 'error',
											msg: 'Could not update inventory, please make sure your inventory is set to public'
										};
										end(response);
									} else {

										for (var i = 0; i <= inventory.length; i++) {

											setTimeout(update, 10 * i, i, inventory);
										}
									}
								});
							}
						} else {
							response = {
								status: 'error',
								msg: 'Could not update inventory, user not in databse'
							};
							end(response);
						}
					}
				});
			}
		});
	}, 500);
});
