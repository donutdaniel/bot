// Load environment variables from .env file
require('dotenv-extended').load();
var restify = require('restify');
var builder = require('botbuilder');
var events = require('events');
var emitter = new events();
// Custom js
var story = require('./story.js');
var parser = require('./util/parser.js');
var buildApp = require('./util/buildApp.js');
// Enable Website
// var website = require('./webpage/server.js');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port_bot || process.env.PORT_BOT || 3978, function () {
   console.log('BOT: %s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Create bot
var ready = false; //used to see if LUIS is ready yet
var atStart = true; //one time check to see if at start
var optionsOn = false; //controls toggling of popup options
var bot = new builder.UniversalBot(connector, [
	function(session){
		if(!ready){
			session.send('Please wait... one or more items are still being processed');
			session.endDialog();
		}else if(atStart){
			session.userData.current = story_.start.id;
			var proceed = story_.start;
			var lines;
			var delay;
			while(proceed != undefined){
				lines = proceed.lines;
				for(var i = 0; i < lines.length; i++){
					delay = lines[i].length * 30;
					for(var j = 0; j < delay/1500; j++){
						session.sendTyping();
						session.delay(1500);
					}
					session.send(lines[i]);
				}
				if(proceed.jump.jump != undefined){
					proceed = proceed.jump.jump;
				}else{
					session.userData.current = proceed.id;
					proceed = undefined;
				}
			}
			atStart = false;
			emitter.emit('recognize');
			if(optionsOn){
				activateOptionBtns(session);
			}else{
				session.endDialog();
			}
		}else{
			session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance or \'repeat\' if you want me to repeat what I said', session.message.text);
			session.endDialog();
		}
	},
	optionResults
]);

// Parse text file into story object
var story_ = parser.parse('stories/' + process.env.STORY_NAME);

// Construct LUIS app and recognizer
var LUIS_URL = process.env.LUIS_URL;
if(LUIS_URL === null ||LUIS_URL === ''){
	buildApp.build(story_);
	buildApp.emitter.on('done', function(url){
		LUIS_URL = url;
		ready = true;
	});
}else{
	ready = true;
}
emitter.on('recognize', function(){
	var recognizer = new builder.LuisRecognizer(LUIS_URL);
	bot.recognizer(recognizer);
})

// Construct path through language intents and story
// session.userData.current is the current segmentID not actual segment
Object.keys(story_.optionslist).forEach(function(key){
	bot.dialog(key, [
		function(session){
					console.log(key);
			var proceed = story_.proceed(session.userData.current, key);
			if(proceed === undefined){
				session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance or \'repeat\' if you want me to repeat what I said', session.message.text);
			}else{
				var lines;
				var delay = 0;
				while(proceed != undefined){
					lines = proceed.lines;
					// send lines
					for(var i = 0; i < lines.length; i++){
						delay = lines[i].length * 30;
						for(var j = 0; j < delay/1500; j++){
							session.sendTyping();
							session.delay(1500);
						}
						session.send(lines[i]);
					}
					// check for jump
					if(proceed.jump.jump != undefined){
						proceed = proceed.jump.jump;
					}else{
						// save segment before break
						session.userData.current = proceed.id;
						proceed = undefined;
					}
				}
			}
			// display options
			if(optionsOn){
				activateOptionBtns(session);
			}else{
				session.endDialog();
			}
		},
		optionResults
	]).triggerAction({
		matches: key
	});
});

// Bot command dialogs
bot.dialog('HelpDialog', function(session){
	session.send('Hi! This is still an experimental bot. Many bugs. Universal commands are:');
	session.send('\'reset\': brings the conversation back to the start.');
	session.send('\'repeat\': repeats the last spoken dialogue.');
	session.send('\'options\': toggles choice prompts in button format.');
	session.endDialog();
}, true).triggerAction({
	matches: /help/
});

bot.dialog('ResetConversation', [
	function(session){
		session.send('Resetting...');
		session.userData.current = story_.start.id;
		var proceed = story_.start;
		var lines;
		var delay;
		while(proceed != undefined){
			lines = proceed.lines;
			for(var i = 0; i < lines.length; i++){
				delay = lines[i].length * 30;
				for(var j = 0; j < delay/1500; j++){
					session.sendTyping();
					session.delay(1500);
				}
				session.send(lines[i]);
			}
			if(proceed.jump.jump != undefined){
				proceed = proceed.jump.jump;
			}else{
				session.userData.current = proceed.id;
				proceed = undefined;
			}
		}
		if(optionsOn){
			activateOptionBtns(session);
		}else{
			session.endDialog();
		}
	},
	optionResults
], true).triggerAction({
	matches: /reset/
});

bot.dialog('RepeatDialog', [
	function(session){
		if(atStart){
			atStart = false;
		}
		var found = story_.getSegment(session.userData.current);
		if(found === undefined){
			session.send('Error retrieving data. Please type \'reset\' to reset the bot');
		}else{
			var lines = found.lines;
			var delay;
			for(var i = 0; i < lines.length; i++){
				delay = lines[i].length * 30;
				for(var j = 0; j < delay/1500; j++){
					session.sendTyping();
					session.delay(1500);
				}
				session.send(lines[i]);
			}
		}
		if(optionsOn){
			activateOptionBtns(session);
		}else{
			session.endDialog();
		}
	},
	optionResults
], true).triggerAction({
	matches: /repeat/
});

bot.dialog('OptionsOn', [
	function(session){
		optionsOn = !optionsOn;
		if(optionsOn){
			session.send('Turning options on');
			activateOptionBtns(session);
		}else{
			session.send('Turning options off');
			session.endDialog();
		}
	},
	optionResults
], true).triggerAction({
	matches: /options/
});

// Helper functions
function activateOptionBtns(session){
	var found = story_.getSegment(session.userData.current);
	if(found === undefined){
		session.send('Error retrieving data. Please type \'reset\' to reset the bot');
	}else{
		var promptOptions = [];
		for(var key_opt in found.options){
			if(found.options.hasOwnProperty(key_opt)){
				promptOptions.push(key_opt);
			}
		}
		builder.Prompts.choice(session, 'Choices:', promptOptions, {listStyle: builder.ListStyle.button});
	}
}

function optionResults(session, results){
	if(results.response){
		bot.beginDialog(session.message.address, results.response.entity);
	}
	session.endDialog();
}