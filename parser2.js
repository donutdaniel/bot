var story = require("./story");
var fs = require("fs");
var stream = require("stream");
var transform  =  stream.Transform;
// tag variables
var tags = ["segment", "option", "jump"];

/*Parses the file and returns a story object*/
function parser(ifile){
	var readable = fs.createReadStream(ifile);
	var temp;
	readable.pipe(process.stdout);
}

module.exports = parser;