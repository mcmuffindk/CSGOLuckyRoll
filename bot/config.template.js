module.exports = {
	steam: {
		user: '', // The username of the bot
		pass: '', // The password for the bot
		shared: '', // The shared_secret of the bot
		identity: '', // The identity_secret of the bot
		language: 'en', // The language the bot should get information in
		cancelTime: 300000, // The time in milliseconds from an offer is sent till it is canceled
		pollInterval: 1000, // The time in milliseconds between polls
	},
	main_db: {
		host: '', // The host of the main database
		user: '', // The user of the main database
		pass: '', // The password for the user
		database: '', // The name of the main database
	},
	inventory_db: {
		host: '', // The host of the inventory database
		user: '', // The user of the inventory database
		pass: '', // The password for the user
		database: '', // The name of the inventory database
	},
	domain: '', // The full domain including HTTP / HTTPS
	port: {
		inventory: 2053, // The port of the inventory process
		deposit: 2083 // The port of the deposit process
	},
	SSL: {
		cert: '', // The path to the SSL certificate relative to the bot folder
		key: '' // The path to the SSL key relative to the bot folder
	},
	api: {
		steam: '', // The steam API key for the bot
		opskins: '' // The OPSkins API key for the bot
	},
	pot: {
		time: 120 // The time in secconds the pot should last
	}
};
