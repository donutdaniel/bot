// Load environment variables from .env file
require('dotenv-extended').load();
var restify = require('restify');
var builder = require('botbuilder');

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
var bot = new builder.UniversalBot(connector, function (session) {
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
});

// Parse text file into structure
var structure = parser('structure_files/story1.txt');

// Construct LUIS app and recognizer
var LUIS_URL = process.env.LUIS_URL;
if(LUIS_URL === ''){
	buildApp.build(structure);
	buildApp.emitter.on('done', function(url){
		LUIS_URL = url;
		var recognizer = new builder.LuisRecognizer(LUIS_URL);
		bot.recognizer(recognizer);
	});
}else{
	recognizer = new builder.LuisRecognizer(LUIS_URL);
	bot.recognizer(recognizer);
}

// Construct path through language intents and structure
bot.dialog('Help', function(session){
	session.endDialog("Hi! This bot is currently in the works. See github for help.");
}).triggerAction({
	matches: 'Help'
});

// Helper
structure.optionsList.forEach(function(value, key, map){
	bot.dialog(key, function(session){
		structure.proceed(key);
		for(var i = 0; i < structure.current.lines.length; i++){
			session.send(structure.current.lines[i]);
		}
		session.endDialog();
	}).triggerAction({
		matches: key
	});
});