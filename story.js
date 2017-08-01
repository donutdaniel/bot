fs = require('fs');

/*fragments of story to be stored in structure class, not accessable in export*/
class segment{
	/* lines - an array of strings to be said in the scene
	 * options - map of (string key, option object)
	 * option object - destinationKey, destination
	 */
	constructor(lines = [], options = new Map(), jumpKey = null, id = undefined){
		this.lines = lines;
		this.options = options;
		this.jumpKey = jumpKey;
		this.jump = undefined;
		this.id = id;
	}

	/*Adds a new option object to options*/
	addOption(key, destinationKey, destination = undefined){
		if(arguments.length < 2){
			console.log('error adding option');
			return;
		}
		var option = new Object();
		option.destinationKey = destinationKey;
		option.destination = destination; //can be connected through structure.connect
		this.options[key] = option;
	}

	addJump(jumpKey){
		this.jumpKey = jumpKey;
		this.jump = undefined;
	}

	/*member variables
	lines, options, jump*/
}

/* main story data structure
 * segments is an options.length-ary tree
 * database of segments is stored as a hashset for easier access
 */
class structure{
	constructor(name, description, id, version){
		this.segments = new Map();
		this.optionslist = new Map();
		this.start = undefined;
		this.name = name;
		this.description = description;
		this.id = id;
		this.version = version;
	}

	/*member functions*/
	/* Creates and adds a new segment, adds to segments*/ 
	addSegment(id, lines, options, jumpKey){
		var tempSegment = new segment(lines, options, jumpKey, id);
		this.segments.set(id, tempSegment);
		if(this.start === undefined){
			this.start = tempSegment;
		}
	}

	/*finds segment and adds option to it*/
	addOption(key, option){
		var tempSegment = this.segments.get(key);
		if(tempSegment != undefined){
			tempSegment.addOption(key, option);
		}
	}

	/*deletes key-value pair internally*/
	delete(key){
		delete this.segments.get(key)
	}

	/*connect all the segments using key identification. Run after adding all the segments*/
	connect(){
		this.segments.forEach(function(value, key, map){
			if(value.jumpKey != null){
				value.jump = map.get(value.jumpKey);
			}else{
				value.options.forEach(function(value_o, key_o, map_o){
					var destSeg = map.get(value_o.destinationKey);
					value_o.destination = destSeg;
				});
			}
		});
	}

	/*follows with proceed key and returns the next segment*/
	proceed(segmentID, key){
		var next = this.segments.get(segmentID);
		if(next != undefined){
			next = next.options.get(key);
			if(next != undefined){
				next = next.destination;
			}
		}
		return next;
	}

	/*returns the segment based on key*/
	getSegment(key){
		return this.segments.get(key);
	}

	/*saves it as a text file*/
	save(){
		var path = 'structure_files/' + this.id + '.txt';
		fs.open(path, 'w', function(err){
			if(err){
				console.log(err);
			}
		});
		var stream = fs.createWriteStream(path);
		//begin building and writing stream
		stream.write(this.name + ' ' + this.version + '\n');
		stream.write(this.description + '\n');
		stream.write(this.id + '\n');
		this.segments.forEach(function(value, key, map){
			stream.write('<segment id=' + key + '>' + '\n');
			value.lines.forEach(function(element){
				stream.write(element + '\n');
			});
			if(value.options.size != 0){
				stream.write('<options>' + '\n');
				value.options.forEach(function(value_o, key_o, map_o){
					stream.write(key_o + ' ' + value_o.destinationKey + '\n');
				});
				stream.write('</options>' + '\n');
			}else if(value.jumpKey != null){
				stream.write('<jump>' + '\n');
				stream.write(value.jumpKey + '\n');
				stream.write('</jump>' + '\n');
			}
			stream.write('</segment>' + '\n')
		});
		if(this.optionslist.size != 0){
			stream.write('<optionslist>' + '\n');
			this.optionslist.forEach(function(value, key, map){
				stream.write(key + ' ' + value.join('/') + '\n');
			});
			stream.write('</optionslist>' + '\n');
		}
		stream.end();
	}

	/*member variables:
	 * start, name, description, id, version
	 * segments [map (id, segment reference)]
	 * optionslist [map (option name, triggers[])]
	 */
}

module.exports = structure;