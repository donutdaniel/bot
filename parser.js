var Story = require('./story.js');
var fs = require('fs');
// guard variables
var guards = ["segment", "option"];

/*Parses the file and returns a story object*/
function parser(ifile){
	fs.readFile(ifile, function(err, data){
		if(err){
			return console.error(err);
		}
		var dataStr = data.toString();
		var begin = dataStr.search("<" + guards[0] + ">");
		var end = dataStr.search("</" + guards[0] + ">");
		var temp = dataStr.substr(begin+3+guards[0].length, end-4-guards[0].length);
		console.log(begin);
		console.log(end);
		console.log(temp);
	});
}

module.exports = parser;