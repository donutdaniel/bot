// Load environment variables from .env file
require('dotenv-extended').load();
var restify = require('restify');
var builder = require('botbuilder');

// Custom js
var Story = require('./story.js');
var parser = require('./parser.js');
var nlpbuild = require('./build.js');

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

// LUIS recognizer
var recognizer = new builder.LuisRecognizer(process.env.LUIS_URL);
bot.recognizer(recognizer);


bot.dialog('Help', function(session){
	session.endDialog("Hi! This bot is currently in the works. Ask smart questions and don't be stupid");
}).triggerAction({
	matches: 'Help'
});

bot.dialog('Visit', function(session){
	session.endDialog("Oh that sounds cool!");
}).triggerAction({
	matches: 'Visit'
});


// Story construction
var story = parser('structure_files/story1.txt');
var url = nlpbuild.build(story);