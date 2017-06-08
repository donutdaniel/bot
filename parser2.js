var story = require("./story");
var fs = require("fs");
var stream = require("stream");
// tag variables
var tags = ["segment", "option", "jump"];

/*Parses the file and returns a story object*/
function parser(ifile){
	var data = fs.createReadStream(ifile);
	data.pipe(process.stdout);
}

module.exports = parser;