var Story = require('./story.js');
var fs = require('fs');
// tag variables
var tags = ["segment", "option"];

/*Parses the file and returns a story object*/
function parser(ifile){https://stackoverflow.com/questions/6109882/regex-match-all-characters-between-two-strings
	var story = new Story();

	fs.readFile(ifile, function(err, data){
		if(err){
			return console.error(err);
		}
		// variables
		var dataStr = data.toString(); //txt file in string format
		var beginSeg, endSeg, beginOpt, endOpt, beginIm, endIm; //beginning and end indicies of tags
		var id;
		var lines = [];
		while(dataStr.length != 0){
			beginSeg = dataStr.search("<" + tags[0] + " id=");
			endSeg = dataStr.search("</" + tags[0] + ">");
			if(beginSeg === -1 || endSeg === -1 || endSeg < beginSeg){
				// format error or end
				break;
			}

			// extract id
			id = dataStr.substring(beginSeg + tags[0].length + 5, dataStr.search(">"));
			beginSeg = tags[0].length + 6 + id.length;

			//extract lines
			
		}
		var temp = dataStr.substring(beginSeg, endSeg);
		console.log(temp);
	});
}

module.exports = parser;