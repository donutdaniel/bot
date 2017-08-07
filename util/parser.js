var story = require('../story.js');
var fs = require('fs');

/*takes the data as a string and returns a story*/
function parseHelper(data){
	var dataArray = data.toString().split("\n");
	if(dataArray.length < 3){
		throw 'error parsing';
	}
	var nameVer = dataArray[0].split(" ");
	var story_options = {
		name: nameVer[0],
		version: nameVer[1],
		description: dataArray[1],
		id: dataArray[2]
	}
	var story_ = new story(story_options);
	// globals for parsing below
	var index = 3;
	var id;
	while(index < dataArray.length){
		if(id = dataArray[index].match(/<segment id=(.*?)>/)){ // match for segment starter
			id = id[1];
			// reset variables
			var lines = new Array(0);
			var options = {};
			var jump = {};
			index++;
			if(id.length < 1){
				throw Error('parsing error: no id');
			}
			while(dataArray[index].match(/<\/segment>/g) === null){ // loop until segment end
				// match for options or jump starters
				if(dataArray[index].match(/<options>/g)){
					index++;
					while(dataArray[index].match(/<\/options>/g) === null){ // loop until option end
						// extract option
						var optionsArray = dataArray[index].split(" ");
						var option = {
							destinationKey: optionsArray[1],
							destination: undefined
						};
						options[optionsArray[0]] = option;
						index++;
					}
				}else if(dataArray[index].match(/<jump>/g)){
					index++;
					if(dataArray[index].match(/<\/jump>/g) === null){
						// extract jump
						jump.jumpKey = dataArray[index];
						index++;
					}else{
						throw Error('parsing error: jump fault');
					}
				}else{
					lines.push(dataArray[index]);
				}
				index++;
			}
			// create and add segment
			story_.addSegment(id, lines, options, jump);
		}else if(dataArray[index].match(/<optionslist/)){
			index++;
			var optionslist = {};
			while(dataArray[index].match(/<\/optionslist/g) === null){
				var optionStr = dataArray[index];
				var spaceIndex = optionStr.indexOf(" ");
				var optionKey = optionStr.substring(0, spaceIndex);
				var optionTriggers = optionStr.substring(optionKey.length+1, optionStr.length).split("/");
				optionslist[optionKey] = optionTriggers;
				index++;	
			}
			story_.setOptionslist(optionslist);
		}
		index++;
	}
	return story_;
}

/*synchronously parses the file and returns a connected story object*/
function parse(ifile){
	var story_ = parseHelper(fs.readFileSync(ifile));
	story_.connect();
	return story_;
}

function safeParse(ifile){
	return parseHelper(fs.readFileSync(ifile));
}

exports.parse = parse;
exports.safeParse = safeParse;