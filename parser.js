var Story = require('./story.js');
var fs = require('fs');
var stream = require('stream');
// tag variables
var tags = ["segment", "option", "jump"];

/*Parses the file and returns a story object*/
function parser(ifile){
	var story = new Story();

	fs.readFile(ifile, function(err, data){
		if(err){
			return console.error(err);
		}
		// variables
		var dataStr = data.toString(); //txt file in string format
		var beginSeg, endSeg, beginOpt, endOpt, beginJp, endJp; //beginning and end indicies of tags
		var id;
		var lines = [];
		var index = 0; //working index
		
		while(dataStr.length != 0){
			beginSeg = dataStr.search("<" + tags[0] + " id=");
			endSeg = dataStr.search("</" + tags[0] + ">");
			beginOpt = dataStr.search("<" + tags[1] + ">");
			endOpt = dataStr.search("</" + tags[1] + ">");
			beginJp = dataStr.search("<" + tags[2] + ">");
			endJp = dataStr.search("</" + tags[2] + ">");
			if(beginSeg === -1 || endSeg === -1 || endSeg < beginSeg){
				// format error or end
				break;
			}

			// extract id
			id = dataStr.substring(beginSeg + tags[0].length + 5, dataStr.search(">"));
			beginSeg = tags[0].length + 6 + id.length;
			index = beginSeg

			//extract lines
			if(beginOpt != -1){
			}
		}
		var temp = dataStr.substring(beginSeg, endSeg);
		console.log(temp);
	});
}

module.exports = parser;