'use strict'

var slack = require('slack');
var express = require('express');
var request = require('request');
var sqlite3 = require('sqlite3');
var app = express();

let bot = slack.rtm.client();
let token = process.env.SLACK_TOKEN;
var db;

app.get('/', function (req, res) {
	res.send('Uber Coffee Bot is up and running!!!');
})
 
app.listen(3000, (err) => {
	if (err) throw err

	console.log('Started ...');
	bot.listen({token});
	
	db = new sqlite3.Database('karma.db');
	db.serialize(function() {
		db.run("CREATE TABLE if not exists karma (name TEXT PRIMARY KEY, score INTEGER)");
	});
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
				var img;
				var currentTemp = parseFloat(body.temp);

				if(currentTemp > 24.0) {
					img = "https://cloud.githubusercontent.com/assets/26482831/24185681/580609f8-0f39-11e7-845d-36aaf6d52522.gif";
				} else if(currentTemp > 22.0) {
					img = "https://cloud.githubusercontent.com/assets/26482831/24185682/5807c824-0f39-11e7-8530-2d3df52dd31b.gif";
				} else if(currentTemp > 21.0) {
					img = "https://cloud.githubusercontent.com/assets/26482831/24185679/57f9c242-0f39-11e7-8bcd-fcd969e14c04.gif";
				} else if(currentTemp > 20.0) {
					img = "https://cloud.githubusercontent.com/assets/26482831/24185683/58084fd8-0f39-11e7-9667-c0d60dcf4dc5.gif";
				} else if(currentTemp <= 20.0) {
					img = "https://cloud.githubusercontent.com/assets/26482831/24185680/57fe10ea-0f39-11e7-9d85-79a1d9d7cd26.gif";
				}

				if(currentTemp == 655.35 || currentTemp == 999) {
					img = "http://sunwindsolar.com/wp-content/uploads/2013/01/heat.jpg";
				}

				postMessageAndImage(message.channel, "The current temperature in the chromosquad area is: " + body.temp + " degrees celsius", img);
		    }
		})
	}

	// halp me
	if (/help|halp/i.test(rawMessage)) {
		postMessageAndImage(message.channel, 'Sending help! Please stand by.', 'https://media.tenor.co/images/3b371a985e414985dfe2626fb326c989/raw');	
	}

	// much doge
	if (/(such|much)\s([^\s]*)/i.test(rawMessage)) {

		var suchPhrase = /((?:such|much)\s(?:[^\s]*))/i.exec(rawMessage);
		postMessageAs(message.channel, '"' + suchPhrase[1] + '"', 'doge', 'https://ih0.redbubble.net/image.28632195.0283/flat,800x800,070,f.jpg');	
	}
	
	// karma
	if (/(?:[^\s]+|".*")\s?(?:\+[\+]+|-[-]+)/i.test(rawMessage)) {
		
		var karmarama = /([^\s\+-]+|".*")\s?(\+[\+]+|-[-]+)/ig.exec(rawMessage);
		var name = karmarama[1];
		var karmaPoints = convertToPoints(karmarama[2]);
				
		// control yourself
		if (name == "<@" + message.user + ">") {
			if (karmaPoints > 0) {
				postMessage(message.channel, "Don't be a weasel <@" + message.user + ">.");
			} else {
				postMessage(message.channel, "Aww, don't be so hard on yourself.");
			}
			return;
		}
		
		db.serialize(function() {
			// Get the current karma
			var currentScore = 0;
			var newScore = 0;
			db.get("SELECT name, score FROM karma WHERE name = ?", name, function(err, row) {
				if (row != undefined) {
					currentScore = row.score;
				}
				// Insert or update the new karma value
				newScore = currentScore + karmaPoints;
				db.run("INSERT OR REPLACE INTO karma (name, score) VALUES (?,?)", [name, newScore], function(err) {
					if (err) throw err;
					postMessage(message.channel, ">_" + name + "'s karma is now " + newScore + "_");
				});
			});
		});
				
	}
	
	// Reset all the things
	if (/^coffeebotresetallthekarmaplz$/i.test(rawMessage)) {
		db.serialize(function() {
			db.run("DELETE FROM karma; VACUUM", function(err) {
				if (err) throw err;
				postMessage(message.channel, ">_All your karma has been reset._");
			});
		});
	}
	
	// Check the score
	if (/^karma of (.*)$/i.test(rawMessage)) {
		var query = /^karma of (.*)$/ig.exec(rawMessage);
		var name = query[1];
		var score = 0;
		db.serialize(function() {
			db.get("SELECT score FROM karma WHERE name = ?", name, function(err, row) {
				if (err) throw err;
				if (row) score = row.score;
				postMessage(message.channel, ">_" + name + " has " + score + " karma._");
			});
		});
	}
	
	// Check the score
	if (/^(top|bottom) karma$/i.test(rawMessage)) {
		var query = /^(top|bottom) karma$/ig.exec(rawMessage);
		var topBottom = query[1];
		var sortOrder = "ASC";
		if (topBottom.toLowerCase() == "top" ) sortOrder = "DESC"

		db.serialize(function() {
			db.all("SELECT name, score FROM karma ORDER BY SCORE " + sortOrder + " LIMIT 5", function(err, rows) {
				if (err) throw err;
				var results = ">>> The " + topBottom.toLowerCase() + " things with karma are: \n"
				for (var i = 0; i < rows.length; i++) {
					results += "\t" + rows[i].score + "\t-\t" + rows[i].name + "\n";
				}
				postMessage(message.channel, results);
			});
		});
	}
	
});

function postMessageAndImage(channel, message, imageUrl) {
	slack.chat.postMessage({
		token: token,
		as_user: true,
		channel: channel,
		text: message,
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

function postImage(channel, imageUrl) {
	postMessageAndImage(channel, '', imageUrl);
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

function postMessageAs(channel, message, username, userIconUrl) {
	slack.chat.postMessage({
		token: token,
		username: username,
		icon_url: userIconUrl,
		channel: channel,
		text: message
	}, function (err, data) {
		if (err) console.log(err);
	})
}

function convertToPoints(karma) {
	// Throttle to +/- 5
	karma = karma.substring(0,6); 
	var points = karma.length - 1;
	if (karma.indexOf('+') > -1) {
		return points;
	}
	if (karma.indexOf('-') > -1) {
		return 0 - points;
	}
	return 0;
}