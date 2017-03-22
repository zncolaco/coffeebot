'use strict'

var slack = require('slack');
var express = require('express');
var request = require('request')
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

bot.hello(message=> {
    postMessage('random', "I is started :coffee:");
})

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

	// adele
	if (/adele/i.test(rawMessage)) {
		postImage(message.channel, 'https://media.giphy.com/media/znnVZx8GMzs5O/giphy.gif');	
	}

	// wiki
	if (/tell me about (.*)/i.test(rawMessage)) {
		var query = /^tell me about (.*)$/i.exec(rawMessage);
		var wikiQuery = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&redirects=1&explaintext=&titles=' + encodeURI(query[1]);

		request(wikiQuery, function (error, response, body) {
			var pages = JSON.parse(response.body).query.pages;
			// Do we ever get more than one page? Who knows.
			for (var page in pages) {
				if (pages[page].extract) {
					postMessage(message.channel, 'https://en.wikipedia.org/wiki/' + pages[page].title.replace(/ /gi, '_'));
				} else {
					postMessage(message.channel, '\'' + query[1] + '\' was a little weird, even for me. :neutral_face:');
				}
			}
		});
	}

	// 160 office temp
	if(/temperature/i.test(rawMessage)) {
		var url = "http://mqtt-sensors.azurewebsites.net/temp/current"

		request({
		    url: url,
		    json: true
		}, function (error, response, body) {
		    if (!error && response.statusCode === 200) {
		    	postMessage(message.channel, "The current temperature in the chromosquad area is: " + body.temp + " degrees celsius");
		    }
		})
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
