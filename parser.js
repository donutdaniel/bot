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
		var index = 0;
		var id;
		var jump;

		while(index < dataArray.length){
			if(id = dataArray[index].match(/<segment id=(.*?)>/)[1]){ // match for segment starter
				// reset variables
				var lines = new Array(0);
				var options = new Map();
				jump = null;
				index++;
				if(id.length < 1){
					throw 'no id';
				}

				while(dataArray[index].match(/<\/segment>/g) === null){ // loop until segment end
					// match for options or jump starters
					if(dataArray[index].match(/<options>/g)){
						index++;
						while(dataArray[index].match(/<\/options>/g) === null){ // loop until option end
							// extract option
							var optionsArray = dataArray[index].split(" ");
							if(optionsArray.length < 2){
								throw 'option formatting error';
							}
							var option = new Object();
							option.destination = optionsArray[1];
							if(optionsArray.length > 2){
								option.triggers = optionsArray.slice(2, optionsArray.length);
							}
							options.set(optionsArray[0], option);
							index++;
						}
					}else if(dataArray[index].match(/<jump>/g)){
						index++;
						if(dataArray[index].match(/<\/jump>/g) === null){
							// extract jump
							jump = dataArray[index];
						}else{
							throw "Jump fault";
						}
					}else{
						lines.push(dataArray[index]);
					}
					index++;
				}
				// create and add segment
				story.addSegment(id, lines, options, jump);
			}
			index++;
		}

		console.log(story);

		return story;
	});
}

module.exports = parser;