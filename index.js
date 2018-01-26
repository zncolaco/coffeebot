'use strict'

var slack = require('slack');
var express = require('express');
var request = require('request');
var sqlite3 = require('sqlite3');
var karma = require('./karma.js');
var cron = require('cron-scheduler');
var app = express();

let bot = slack.rtm.client();
let token = process.env.SLACK_TOKEN;
var db = new sqlite3.Database('karma.db');
var server;

function start () {
  server = app.listen(3000, (err) => {
    if (err) throw err

    console.log('Started ...');
    bot.listen({token});
    karma.startup(db).catch((err) => {
      postMessage(message.channel, `I failed. Please tell an admin I sent you: ${err}`);
    });
  });
}

start();

app.get('/', function (req, res) {
	res.send('Uber Coffee Bot is up and running!!!');
})

bot.hello(message=> {
    postMessage('random', "I is started :coffee:");
})

// Events
bot.message(function (message) {
	
	// Only respond to human messages
	if (!message.user || message.bot_id) return;
	
	var rawMessage = message.text;
	
	// hello it me
	if (/^h(i)+(\s[\S]*)?$|^h[e]+l[l]+[o]+(\s[\S]*)?$|adele/i.test(rawMessage)) {
    var myArrayOfAdeleGifs = [
      'https://media.riffsy.com/images/44aed745f86834ab57d88bc010bb036c/tenor.gif',
      'https://media.giphy.com/media/znnVZx8GMzs5O/giphy.gif'
    ];
    var adele = myArrayOfAdeleGifs[Math.floor(Math.random() * myArrayOfAdeleGifs.length)];
		postImage(message.channel, adele);
    return;
	}
	
	// unacceptable
	if (/unacceptable/i.test(rawMessage)) {
		postImage(message.channel, 'https://media.giphy.com/media/3eKdC7REvgOt2/giphy.gif');
    return;
	}

	// unbelievable
	if (/unbelievable|unbohlievable/i.test(rawMessage)) {
		postImage(message.channel, 'https://s28.postimg.org/dob9qbnkd/4zy4k_XH.gif');
    return;
	}    	

	// acceptable pronounciation
	if (/tomato/i.test(rawMessage)) {
		postMessage(message.channel, "Tom-ah-to");
    return;
	}

	// wiki
	if (/^tell me about (.*)$/i.test(rawMessage)) {
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
    return;
	}

	// much doge
	if (/(such|much)\s([^\s]*)/i.test(rawMessage)) {
		var suchPhrase = /((?:such|much)\s(?:[^\s]*))/i.exec(rawMessage);
		postMessageAs(message.channel, '"' + suchPhrase[1] + '"', 'doge', 'https://ih0.redbubble.net/image.28632195.0283/flat,800x800,070,f.jpg');	
    return;
	}
	
	// karma
	if (/(?:[^\s-+]+|".*")\s?(?:\+[\+]+|-[-]+)/i.test(rawMessage)) {
		
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
    
    karma.setKarma(db, name, karmaPoints).then((newScore) => {
      postMessage(message.channel, ">_" + name + "'s karma is now " + newScore + "_");
    }).catch((err) => {
      postMessage(message.channel, `I failed. Please tell an admin I sent you: ${err}`);
    });
		return;
	}
	
	// Reset all the things
	if (/^coffeebotresetallthekarmaplz$/i.test(rawMessage)) {
    karma.nuclearBomb(db).then(() => {
      postMessage(message.channel, ">_All your karma has been reset._");
    }).catch(() => {
      postMessage(message.channel, `I failed. Please tell an admin I sent you: ${err}`);
    });
    return;
	}
	
	// Check the score
	if (/^karma of (.*)$/i.test(rawMessage)) {
		var query = /^karma of (.*)$/ig.exec(rawMessage);
		var name = query[1];
    karma.getKarma(db, name).then((score) => {
      postMessage(message.channel, ">_" + name + " has " + score + " karma._");
    });
    return;
	}
	
	// Check the score
	if (/^(top|bottom) karma$/i.test(rawMessage)) {
		var query = /^(top|bottom) karma$/ig.exec(rawMessage);
		var topBottom = query[1];
		var sortOrder = "ASC";
		if (topBottom.toLowerCase() == "top" ) sortOrder = "DESC"
    
    karma.getLeaderboard(db, sortOrder).then((rows) => {
      var results = ">>> The " + topBottom.toLowerCase() + " things with karma are: \n"
      for (var i = 0; i < rows.length; i++) {
        results += "\t" + rows[i].score + "\t-\t" + rows[i].name + "\n";
      }
      postMessage(message.channel, results);
    }).catch((err) => {
      postMessage(message.channel, `I failed. Please tell an admin I sent you: ${err}`);
    });
    return;
	}
  
  // I can't believe this is necessary
	if (/^sudo service coffeebot restart$/i.test(rawMessage)) {
    console.log("Stopping...");
    server.close();
    start();
    return;
	}
	
});

// chrisbot
cron({
  timezone: 'Pacific/Auckland',
  on: '30 16 * * 5',
  name: 'beertime'
} , function () {
  postMessageAs('random', ':beer:++', 'chrisbot', 'http://icons.iconarchive.com/icons/icons8/ios7/128/Sports-Skiing-icon.png');
})

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