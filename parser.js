var Story = require('./story.js');
var fs = require('fs');

/*takes the data as a string and returns a story*/
function parseHelper(data){
	var story = new Story();
	var dataArray = data.toString().split("\r\n");
	var index = 2;
	var id;
	var jump;
	if(dataArray.length < 2){
		throw 'error parsing';
	}
	story.name = dataArray[0];
	story.description = dataArray[1];
	
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
						option.destinationKey = optionsArray[1];
						option.destination = undefined;
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
	story.connect();
	return story;
}

/*synchronously parses the file and returns a connected story object*/
function parser(ifile){
	return parseHelper(fs.readFileSync(ifile));
}

module.exports = parser;