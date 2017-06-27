// Load environment variables from .env file
require('dotenv-extended').load();
var restify = require('restify');
var builder = require('botbuilder');
var events = require('events');
var emitter = new events();

// Custom js
var structure = require('./structure.js');
var parser = require('./parser.js');
var buildApp = require('./buildApp.js');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Set default response
var start = true;
var bot = new builder.UniversalBot(connector, function(session){
	if(start){
		var proceed = true;
		while(proceed){
			for(var i = 0; i < structure.current.lines.length; i++){
				session.send(structure.current.lines[i]);
			}
			if(structure.current.jump != undefined){
				structure.current = structure.current.jump;
			}else{
				proceed = false;
			}
		}
		start = false;
		emitter.emit('initiated');
	}else{
		session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
	}
});

// Parse text file into structure
var structure = parser('structure_files/story1.txt');

// Construct LUIS app and recognizer
var LUIS_URL = process.env.LUIS_URL;
if(LUIS_URL === ''){
	buildApp.build(structure);
	buildApp.emitter.on('done', function(url){
		LUIS_URL = url;
	});
}
emitter.on('initiated', function(){
	var recognizer = new builder.LuisRecognizer(LUIS_URL);
	bot.recognizer(recognizer);
})

// Construct path through language intents and structure

//helper functions
structure.optionslist.forEach(function(value, key, map){
	bot.dialog(key, function(session){
		var proceed = structure.proceed(key);
		if(!proceed){
			session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
		}else{
			while(proceed){
				var lines = structure.current.lines;
				var delay = 0;
				for(var i = 0; i < structure.current.lines.length; i++){
					delay = lines[i].length * 30;
					for(var j = 0; j < delay/1500; j++){
						session.sendTyping();
						session.delay(1500);
					}
					session.send(lines[i]);
				}
				if(structure.current.jump != undefined){
					structure.current = structure.current.jump;
				}else{
					proceed = false;
				}
			}
		}
		session.endDialog();
	}).triggerAction({
		matches: key
	});
});

bot.dialog('Help', function(session){
	session.endDialog("Hi! This bot is currently in the works. See github for help.");
}, true).triggerAction({
	matches: 'Help'
});
