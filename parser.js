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
		var dataArray = data.toString().split("\r\n");
		var lines = [];
		var index = 0;
		var id;
		
		while(index < dataArray.length){
			if(id = dataArray[index].match(/<segment id=(.*?)>/)[1]){ // match for segment starter
				index++;
				// extract id

				while(dataArray[index].match(/<\/segment>/g) === null){ // loop until segment end
					// match for option starter
					if(dataArray[index].match(/<options>/g)){
						index++;
						while(dataArray[index].match(/<\/options>/g) === null){ // loop until option end
							// extract option

							index++;
						}
					}
					// match for jump starter
					if(dataArray[index].match(/<jump>/g)){
						index++;
						if(dataArray[index].match(/<\/jump>/g) === null){
							// extract jump

						}else{
							throw "Jump fault";
						}
					}
					//extract line

					index++;
				}
			}
			index++;
		}

		// while(dataStr.length != 0){
		// 	beginSeg = dataStr.search("<" + tags[0] + " id=");
		// 	endSeg = dataStr.search("</" + tags[0] + ">");
		// 	beginOpt = dataStr.search("<" + tags[1] + ">");
		// 	endOpt = dataStr.search("</" + tags[1] + ">");
		// 	beginJp = dataStr.search("<" + tags[2] + ">");
		// 	endJp = dataStr.search("</" + tags[2] + ">");
		// 	if(beginSeg === -1 || endSeg === -1 || endSeg < beginSeg){
		// 		// format error or end
		// 		break;
		// 	}

		// 	// extract id
		// 	id = dataStr.substring(beginSeg + tags[0].length + 5, dataStr.search(">"));
		// 	beginSeg = tags[0].length + 6 + id.length;
		// 	index = beginSeg

		// 	//extract lines
		// 	if(beginOpt != -1){
		// 		while(beginOpt > index && index < endSeg){
		// 			lines.push();
		// 		}
		// 	}
		// 	break;
		// }
		// var temp = dataStr.substring(beginSeg, endSeg);
		// // console.log(temp);
	});
}

module.exports = parser;