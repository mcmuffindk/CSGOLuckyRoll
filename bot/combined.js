"use strict";

const logging = require('node-my-log');
const express = require('express');
const cors = require('cors');
const refresh = express();
const deposit = express();
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
const Deposit = https.createServer(httpsOptions, deposit);

Refresh.listen(config.port.inventory);
Deposit.listen(config.port.deposit);

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

// deposit

deposit.get('/', cors(corsOptions), (req, res) => {

	log.debug('New request on port ' + config.port.deposit, '[Combined]');

	var data = url.parse(req.url, true).query;
	var length = Object.keys(data).length;
	var steamid = data.steamid;
	var trade_url;
	var response;

	var end = (callback) => {

		var response = JSON.stringify(callback);

		res.writeHead(200, {
			'Access-Control-Allow-Origin': config.domain,
			'Content-Type': 'application/json'
		});
		res.end(response);
	};

	var deposit = (offer, secret, items, checked) => {

		var queue = (i) => {
			db_main.query("SELECT price FROM pricing WHERE name = '" + checked[i].name + "'", (err, result) => {
				if (err) {
					log.error(JSON.stringify(err).replace(/\'/g, '\\\''), '[Combined]');
					response = {
						'status': 'error',
						'msg': 'Could not send trade offer'
					};
					end(response);
				} else {
					db_main.query("INSERT INTO low_queue (steam_id, trade_id, item_assetid, item_name, price) VALUES (" + offer.partner.getSteamID64() + ", " + offer.id + ", " + checked[i].assetid + ", '" + checked[i].name + "', " + result[0].price + ")", (err) => {
						if (err) {
							log.error(JSON.stringify(err).replace(/\'/g, '\\\''), '[Combined]');
							response = {
								'status': 'error',
								'msg': 'Could not send trade offer'
							};
							end(response);
						}
					});
				}
			});
		};

		offer.setMessage('trade secret: ' + secret);
		offer.send((err) => {
			if (err) {
				log.error(JSON.stringify(err).replace(/\'/g, '\\\''), '[Combined]');
				response = {
					'status': 'error',
					'msg': 'Could not send trade offer'
				};
				end(response);
			} else {
				// add to queue
				for (var i = 0; i < checked.length; i++) {
					setTimeout(queue, 10 * i, i);
				}
				response = {
					'status': 'success',
					'msg': 'Trade offer <a target="_blank" href="https://steamcommunity.com/tradeoffer/' + offer.id + '/">#' + offer.id + '</a> has been sent successfully! Your secret is: ' + secret
				};
				end(response);
			}
		});
	};

	var inventoryCheck = (items, offer) => {

		var check = [];
		var checked = [];

		var Checks = (i, x, length) => {
			if (i < length) {
				var pos = check.findIndex(check => (check.assetid === items[i].assetid));
				if (pos === -1) {
					x = 1;
				} else {
					// NOTES add name to array 'checked'
					checked.push({
						'assetid': items[i].assetid,
						'name': check[pos].name
					});
				}
			} else {
				if (x === 1) {
					response = {
						'status': 'error',
						'msg': 'One or more selected items is not in your inventory'
					};
					end(response);
				} else {
					if (offer.addTheirItems(items)) {
						var secret = (+new Date() * Math.random()).toString(36).substring(0, 6).toUpperCase();
						deposit(offer, secret, items, checked);
					} else {
						response = {
							'status': 'error',
							'msg': 'One or more selected items is not tradeable'
						};
						end(response);
					}
				}
			}
		};

		var Check = (length, inventory) => {
			var x = 0;
			for (var i = 0; i <= length; i++) {
				setTimeout(Checks, 10 * i, i, x, length, inventory);
			}
		};
		offer.getPartnerInventoryContents(730, 2, (err, inventory) => {
			if (err) {
				response = {
					'status': 'error',
					'msg': 'Can\'t get inventory'
				};
				end(response);
			} else {
				for (var i = 0; i <= inventory.length; i++) {
					if (i < inventory.length) {
						// NOTES push assetid & name to array 'check'
						check.push({
							'assetid': inventory[i].assetid,
							'name': inventory[i].market_hash_name
						});
					} else {
						Check(items.length, inventory);
					}
				}
			}
		});
	};

	if (!steamid) {
		response = {
			'status': 'error',
			'msg': 'SteamID64 not received'
		};
		end(response);
	} else if (length <= 1) {
		response = {
			'status': 'error',
			'msg': 'You have to deposit at least 1 item'
		};
		end(response);
	} else if (length - 1 <= 10) {
		db_main.query("SELECT t_url FROM users WHERE s_id = " + steamid, (err, result) => {
			if (err) {
				response = {
					'status': 'error',
					'msg': 'Trade link not set'
				};
				end(response);
			} else {
				trade_url = result[0].t_url;
				const offer = manager.createOffer(trade_url);

				log.debug('Creating offer', '[Combined]');

				var items = [];
				for (var i = 0; i < length; i++) {
					setTimeout((i) => {
						if (i < length - 1) {
							var x = String(i + 1);
							items.push({
								assetid: data[x],
								appid: '730',
								contextid: '2',
								amount: '1'
							});
						} else {
							if (items.length === length - 1) {
								inventoryCheck(items, offer);
							}
						}
					}, i * 10, i);
				}
			}
		});
	} else {
		response = {
			'status': 'error',
			'msg': 'You can not deposit more than 10 items'
		};
		end(response);
	}
});

manager.on('sentOfferChanged', (offer) => {
	if (offer.state === 3) {
		offer.getReceivedItems((err, items) => {
			if (err) {
				log.error(JSON.stringify(err).replace(/\'/g, '\\\''), '[Combined]');
			} else {
				var recived = [];
				for (var i = 0; i <= items.length; i++) {
					setTimeout((i) => {
						if (i < items.length) {

							// NOTES fix that multiple of same items can be used

							recived.push({
								'assetid': items[i].assetid,
								'name': items[i].market_hash_name
							});
						} else {
							// NOTES MySQL to move items from queue to pot
							db_main.query("SELECT * FROM low_queue WHERE trade_id = '" + offer.id + "'", (err, result) => {
								if (err) {
									log.error(JSON.stringify(err).replace(/\'/g, '\\\''), '[Combined]');
								} else {
									var round = () => {
										db_main.query("SELECT round FROM pot_low_info ORDER BY round DESC", (err, result) => {
											if (err) {
												console.log(err, '[Combined]');
											} else {
												rnd = result[0].round;
											}
										});
									};
									round();
									var rnd;
									for (var i = 0; i < result.length; i++) {
										setTimeout((i) => {
											var pos = recived.findIndex(recived => (recived.name === result[i].item_name));
											if (pos !== -1) {

												recived[pos].name = '';
												var steamid = result[i].steam_id;
												var assetid = recived[pos].assetid;
												var old_assetid = result[i].item_assetid;
												var name = result[i].item_name;
												var price = result[i].price;

												db_main.query("INSERT INTO pot_low (round, steam_id, item_assetid, item_name, price) VALUES (" + rnd + ", " + steamid + ", " + assetid + ", '" + name + "', " + price + ")", (err) => {
													if (err) {
														log.error(JSON.stringify(err).replace(/\'/g, '\\\''), '[Combined]');
													} else {
														db_main.query("DELETE FROM low_queue WHERE  item_assetid = " + old_assetid, (err) => {
															if (err) {
																log.error(JSON.stringify(err).replace(/\'/g, '\\\''), '[Combined]');
															}
														});
													}
												});
											}
										}, 10 * i, i);
									}
								}
							});
						}
					}, 10 * i, i);
				}
			}
		});
	} else {
		// NOTES MySQL to remove items from queue
		db_main.query("DELETE FROM 'low_queue' WHERE trade_id = '" + offer.id + "'", (err) => {
			if (err) {
				log.error(JSON.stringify(err).replace(/\'/g, '\\\''), '[Combined]');
			} else {
				log.debug('Offer removed from queue', '[Combined]');
			}
		});
	}
});









var sendOffers = () => {
	db_main.query("SELECT * FROM outgoing WHERE sent = 0", (err, result) => {
		if (err) {
			log.error('Can\'t get outgoing offers from database', '[Combined]');
		} else {
			if (result.length > 0) {
				
				// NOTES get item assetids and parse them to the offer
				
				var assetids = JSON.parse(result[0].items);
				
				db_main.query("SELECT t_url FROM users WHERE s_id = " + result[0].steam_id, (err, result) => {
					if (err) {
						log.error('Can\'t get trade link, maybe not set', '[Combined]');
					} else {
						const offer = manager.createOffer(result[0].t_url);

						log.debug('Creating winner offer', '[Combined]');

						var items = [];
						for (var i = 0; i <= assetids.length; i++) {
							setTimeout((i) => {
								if (i < assetids.length) {
									items.push({
										assetid: assetids[i],
										appid: '730',
										contextid: '2',
										amount: '1'
									});
								} else {
									offer.addMyItems(items);
									offer.setMessage('Congratulation! Here is what you won. Please notice that we have taken a 10% cut');
									offer.data('cancelTime', 3600000);
									offer.send((err) => {
										if(err){
											console.log(err);
										}
									});
								}
							}, i * 10, i);
						}
					}
				});
			}
		}
	});
};

setTimeout(sendOffers, 10000);