"use strict";

var msgs = [];

function readChat() {
	$.ajax({
		url: config.domain + '/chat.php',
		type: 'POST',
		dataType: 'json',
		data: {
			read: 1
		}
	}).done(function (data) {
		for (var i = 0; i < Object.keys(data).length; i++) {
			var msg = JSON.parse(data[i]);
			if (!msgs.includes(msg.id)) {
				if (msgs.length > 100) {
					msgs.shift();
					$('#chat div').first().remove();
				}
				msgs.push(msg.id);
				if (msg.user === config.steamid) {
					$('#chat').append('<div id="' + msg.id + '" class="self"><img class="user-img" src="' + msg.img + '"><p>' + msg.user + '</p><p>' + msg.msg + '</p></div>');
				} else {
					$('#chat').append('<div id="' + msg.id + '"><img class="user-img" src="' + msg.img + '"><p>' + msg.user + '</p><p>' + msg.msg + '</p></div>');
				}
			}
		}
	}).fail(function () {
		console.log('Failed');
	});
}

function writeChat(msg) {
	$.ajax({
		url: domain,
		type: 'POST',
		data: {
			write: 1,
			user: config.steamid,
			msg: msg
		}
	}).done(function (data) {
		//do something
	}).fail(function () {
		//do something
	});
}
