var structure = require('../structure.js');
var fs = require('fs');

/*takes the data as a string and returns a story*/
function parseHelper(data){
	var story = new structure();
	var dataArray = data.toString().split("\r\n");
	var index = 3;
	var id;
	var jump;
	if(dataArray.length < 2){
		throw 'error parsing';
	}
	var nameVer = dataArray[0].split(" ");
	story.name = nameVer[0];
	if(nameVer[1] === undefined){
		story.version = 0.1;
	}else{
		story.version = nameVer[1];
	}
	story.description = dataArray[1];
	story.version = dataArray[0].split(" ")[1];
	if(dataArray[2] === ''){
		story.id = undefined;
	}else{
		story.id = dataArray[2];
	}
	
	while(index < dataArray.length){
		if(id = dataArray[index].match(/<segment id=(.*?)>/)){ // match for segment starter
			id = id[1];
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
						var option = new Object();
						option.destinationKey = optionsArray[1];
						option.destination = undefined;
						options.set(optionsArray[0], option);
						index++;
					}
				}else if(dataArray[index].match(/<jump>/g)){
					index++;
					if(dataArray[index].match(/<\/jump>/g) === null){
						// extract jump
						jump = dataArray[index];
						index++;
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
		}else if(dataArray[index].match(/<optionslist/)){
			index++;
			while(dataArray[index].match(/<\/optionslist/g) === null){
				var optionStr = dataArray[index];
				var spaceIndex = optionStr.indexOf(" ");
				var optionKey = optionStr.substring(0, spaceIndex);
				var optionTriggers = optionStr.substring(optionKey.length+1, optionStr.length).split("/");
				story.optionslist.set(optionKey, optionTriggers);
				index++;	
			}
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