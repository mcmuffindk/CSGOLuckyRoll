"use strict";

const md5 = require('md5');
const mysql = require('mysql');
const config = require('./config');
const colors = require('colors');

colors.setTheme({
	info: 'green',
	warn: 'yellow',
	debug: 'cyan',
	error: 'red'
});

var db_main = mysql.createConnection({
	host: config.main_db.host,
	user: config.main_db.user,
	password: config.main_db.pass,
	database: config.main_db.database
});

db_main.connect((err) => {
	if (err) {
		console.log(err);
	} else {
		console.log(colors.info('[MySQL]') + ' Connected');
	}
});

var timer = config.pot.time;
var serverStart;

var countdown = () => {
	timer = timer - 1;
	var x = setInterval(() => {
		if (timer > 0) {
			timer = timer - 1;
		}
		if (timer === 0) {
			clearInterval(x);
		}
	}, 1000);
};

var server = () => {
	var round;
	db_main.query("SELECT round FROM pot_low_info ORDER BY round DESC", (err, result) => {
		if (err) {
			console.log(err);
		} else {
			round = result[0].round;

			db_main.query("SELECT * FROM pot_low WHERE round = " + round, (err, result) => {
				if (err) {
					console.log(colors.error('[MySQL]'));
					console.log(err);
				} else {
					var value = (value) => {
						var price = 0;
						for (var i = 0; i <= result.length; i++) {
							setTimeout((i) => {
								if (i < result.length) {
									price = price + result[i].price;
								} else {
									value(price);
								}
							}, 10 * i, i);
						}
					};
					value((price) => {
						var players = (players) => {
							const unique = players.reduce((acc, data) => Object.assign(acc, {
								[data.steam_id]: true
							}), {});
							return Object.keys(unique);
						};

						if (players(result).length < 2) {
							db_main.query("UPDATE pot_low_info SET time = " + config.pot.time + ", players = " + players(result).length + ", items = " + result.length + ", price = " + price + " WHERE round = " + round, (err) => {
								if (err) {
									console.log(err);
								}
							});
						} else if (players(result).length > 1 && timer === config.pot.time) {
							countdown();
							db_main.query("UPDATE pot_low_info SET time = " + timer + ", players = " + players(result).length + ", items = " + result.length + ", price = " + price + " WHERE round = " + round, (err) => {
								if (err) {
									console.log(err);
								}
							});
						} else if (players(result).length > 1 && timer < config.pot.time && timer !== 0) {
							db_main.query("UPDATE pot_low_info SET time = " + timer + ", players = " + players(result).length + ", items = " + result.length + ", price = " + price + " WHERE round = " + round, (err) => {
								if (err) {
									console.log(err);
								}
							});
						} else if (timer === 0) {
							db_main.query("UPDATE pot_low_info SET done = 1, time = " + timer + ", players = " + players(result).length + ", items = " + result.length + ", price = " + price + " WHERE round = " + round, (err) => {
								if (err) {
									console.log(err);
								} else {
									stopServer(round, price);
								}
							});
						}

						db_main.query("UPDATE pot_low_info SET users = '" + JSON.stringify(players(result)) + "' WHERE round = " + round, (err) => {
							if (err) {
								console.log(err);
							}
						});

					});
				}
			});
		}
	});
};

var startServer = () => {
	db_main.query("SELECT * FROM pot_low_info WHERE done = 0", (err, result) => {
		if (err) {
			console.log(err);
		} else {
			if (result.length > 0) {
				timer = result[0].time;
				if (timer < config.pot.time) {
					countdown();
				}
				serverStart = setInterval(server, 1000);
				console.log('catching up on round #' + result[0].round + ', restarting with ' + timer + ' secconds left');
			} else {
				var secret;
				var win;

				var Win = () => {
					win = Math.round((Math.random() * 100) * Math.pow(10, 14)) / Math.pow(10, 14) * 100000000000000;
				};
				var Secret = () => {
					secret = (+new Date() * Math.random()).toString(36).substring(0, 6);
				};
				Win();
				Secret();
				var Hash = () => {
					return md5(win + secret);
				};
				db_main.query("INSERT INTO pot_low_info (time, secret, percentage, hash) VALUES (" + config.pot.time + ", '" + secret + "', " + win + ", '" + Hash() + "')", (err) => {
					if (err) {
						console.log(err);
					} else {
						db_main.query("SELECT round FROM pot_low_info WHERE done = 0 ORDER BY round DESC", (err, result) => {
							if (err) {
								console.log(err);
							} else {
								timer = config.pot.time;
								serverStart = setInterval(server, 1000);
								console.log('starting new round: #' + result[0].round);
							}
						});

					}
				});
			}
		}
	});
};

var stopServer = (round, price) => {
	clearInterval(serverStart);
	var winner = (winner) => {
		db_main.query("SELECT percentage FROM pot_low_info WHERE round = " + round, (err, result) => {
			if (err) {
				console.log(err);
			} else {
				winner(Math.floor((price - 0.0000000001) * ((result[0].percentage / 100000000000000) / 100)));
			}
		});
	};
	winner((winner) => {
		var sendWinner = (id) => {
			db_main.query("SELECT * FROM pot_low WHERE round = " + round + " ORDER BY price DESC", (err, result) => {
				if (err) {
					console.log(err);
				} else {
					var cut = [];
					var cutval = 0;
					var cutper = price * 0.1;
					for (var i = 0; i <= result.length; i++) {
						if (i < result.length) {
							if (cutval < cutper * 1.1 && cutval + result[i].price <= cutper * 1.1) {
								if (result[i].steam_id !== id) {
									cut.push(result[i].item_assetid);
								}
							}
						} else {
							db_main.query("SELECT * FROM pot_low WHERE round = " + round, (err, result) => {
								var wonItems = [];

								for (var i = 0; i <= result.length; i++) {
									if (i < result.length) {
										if (!cut.includes(result[i].item_assetid)) {
											wonItems.push(result[i].item_assetid);
										}
									} else {

										var items = "'" + JSON.stringify(wonItems) + "'";

										db_main.query("INSERT INTO outgoing (steam_id, items) VALUES (" + id + ", " + items + ")", (err) => {
											if (err) {
												console.log(err);
											}
										});
									}
								}
							});
						}
					}
				}
			});
		};

		db_main.query("UPDATE pot_low_info SET winner_ticket = " + winner + " WHERE round = " + round, (err) => {
			if (err) {
				console.log(err);
			} else {
				var ticket = winner;
				db_main.query("SELECT * FROM pot_low WHERE round = " + round + " ORDER BY entry_id ASC", (err, result) => {
					if (err) {
						console.log(err);
					} else {
						var tickets = 0;
						var entry = 0;
						var winner = () => {
							if (tickets + result[entry].price >= ticket) {

								db_main.query("UPDATE pot_low_info set winner = " + result[entry].steam_id + " WHERE round = " + round, (err) => {
									if (err) {
										console.log(err);
									}
								});

								sendWinner(result[entry].steam_id);

							} else {
								console.log('winner not found, trying again');
								entry = entry + 1;
								winner();
							}
						};
						winner();
						startServer();
					}
				});
			}
		});
	});
};

startServer();
