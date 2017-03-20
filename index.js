'use strict'

var slack = require('slack');
var express = require('express');
var app = express();

let bot = slack.rtm.client();
let token = process.env.SLACK_TOKEN;

app.get('/', function (req, res) {
	res.send('Uber Coffee Bot is up and running!!!');
})
 
app.listen(3000, (err) => {
	if (err) throw err

	console.log('Started ...');
	bot.listen({token});
});

// Events
bot.message(function (message) {
	
	// Only respond to human messages
	if (!message.user || message.bot_id) return;
	
	var rawMessage = message.text;
	
	// hello
	if (/^h(i)+(\s[\S]*)?$|^h[e]+l[l]+[o]+(\s[\S]*)?$/i.test(rawMessage)) {
		postImage(message.channel, 'https://media.riffsy.com/images/44aed745f86834ab57d88bc010bb036c/tenor.gif');
	}
	
	// unacceptable
	if (/unacceptable/i.test(rawMessage)) {
		postImage(message.channel, 'https://media.giphy.com/media/3eKdC7REvgOt2/giphy.gif');
	}

	// unbelievable
	if (/unbelievable|unbohlievable/i.test(rawMessage)) {
		postImage(message.channel, 'https://s28.postimg.org/dob9qbnkd/4zy4k_XH.gif');
	}
    
	// acceptable pronounciation
	if (/tomato/i.test(rawMessage)) {
		postMessage(message.channel, "Tom-ah-to");
	}
	
});

function postImage(channel, imageUrl) {
	slack.chat.postMessage({
		token: token,
		as_user: true,
		channel: channel,
		text: '',
		attachments: [
			{
				text: '',
				image_url: imageUrl
			}
		]
	}, function (err, data) {
		if (err) console.log(err);
	})
}

function postMessage(channel, message) {
	slack.chat.postMessage({
		token: token,
		as_user: true,
		channel: channel,
		text: message
	}, function (err, data) {
		if (err) console.log(err);
	})
}
