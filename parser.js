var Story = require('./story.js');
var fs = require('fs');

function parser(ifile){
	fs.readFile(ifile, function(err, data){
		if(err){
			return console.error(err);
		}
		var dataStr = data.toString();
	});
}

module.exports = parser;