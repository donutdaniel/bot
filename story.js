fs = require('fs');

/*fragments of story to be stored in story class, not accessable in export*/
class segment{
	/* id - unique segment id
	 * lines - an array of strings to be said in the scene
	 * options - object map of {optionName: {destionationKey, destination}}
	 * jump - object {jumpKey, jump}
	 */
	constructor(id = undefined, lines = [], options = {}, jump = {}){
		this.id = id;
		this.lines = lines;
		this.options = options;
		this.jump = jump
	}

	/*Adds a new option object to options*/
	addOption(optionName, destinationKey, destination = undefined){
		if(arguments.length < 2){
			console.log('error adding option');
			return;
		} 
		this.options[optionName] = {
			destinationKey: destinationKey,
			destination: destination //can be connected through story.connect
		};
	}

	addJump(jump){
		this.jump = jump;
	}
}

/* main story data structure
 * segments is an segment.length-ary tree
 */
class story{
	/* segments - object map {segmentID: segment}
	 * optionslist - object map of arrays {optionID: [lines]}
	 * start - start segment
	 * name, description, id, version - information
	 */

	/*options - {name, description, id, version}*/
	constructor(options = {}){
		this.name = options.name;
		this.description = options.description;
		this.id = options.id;
		this.version = options.version;
		this.segments = {};
		this.optionslist = {};
		this.start = undefined;
	}

	/*member functions*/
	/* Creates and adds a new segment, adds to segments*/ 
	addSegment(id, lines, options, jump){
		if(this.segments[id] === undefined){
			var tempSegment = new segment(id, lines, options, jump);
			this.segments[id] = tempSegment;
			if(this.start === undefined){
				this.start = tempSegment;
			}
		}
	}

	/*finds segment and adds option to it*/
	addOption(id, optionName, optionKey, destionationKey, destination){
		if(this.segments[id] != undefined){
			this.segments[id].addOption(key, option, optionName, optionKey, destinationKey, destination);
		}
	}

	/*deletes key-value pair internally*/
	delete(id){
		delete this.segments[id]
	}

	/*connect all the segments using key identification. Run after adding all the segments*/
	connect(){
		for(var key_seg in this.segments){
			if(this.segments.hasOwnProperty(key_seg)){
				var segment_ = this.segments[key_seg];
				if(segment_.jump.jumpKey != undefined){
					segment_.jump.jump = this.segments[segment_.jump.jumpKey];
				}else{
					for(var key_opt in segment_.options){
						if(segment_.options.hasOwnProperty(key_opt)){
							segment_.options[key_opt].destination = this.segments[segment_.options[key_opt].destinationKey];
						}
					}
				}
			}
		}
	}

	/*follows with proceed key and returns the next segment*/
	proceed(segmentID, optionID){
		var next = this.segments[segmentID];
		if(next != undefined){
			next = next.options[optionID];
			if(next != undefined){
				next = next.destination;
			}
		}
		return next;
	}

	/*returns the segment based on key*/
	getSegment(id){
		return this.segments[id];
	}

	/*sets the optionlist*/
	setOptionslist(optionslist){
		this.optionslist = optionslist;
	}

	/*saves it as a text file*/
	save(){
		var path = 'stories/' + this.id + '.txt';
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
		for(var key_seg in this.segments){
			if(this.segments.hasOwnProperty(key_seg)){
				var segment_ = this.segments[key_seg];
				stream.write('<segment id=' + key_seg + '>' + '\n');
				segment_.lines.forEach(function(val_line){
					stream.write(val_line + '\n');
				});
				if(Object.keys(segment_.options).length != 0){
					stream.write('<options>' + '\n');
					for(var key_opt in segment_.options){
						if(segment_.options.hasOwnProperty(key_opt)){
							stream.write(key_opt + ' ' + segment_.options[key_opt].destinationKey + '\n');
						}
					}
					stream.write('</options>' + '\n');
				}else if(segment_.jump.jumpKey != undefined){
					stream.write('<jump>' + '\n');
					stream.write(segment_.jump.jumpKey + '\n');
					stream.write('</jump>' + '\n');
				}
				stream.write('</segment>' + '\n');
			}
		}
		if(Object.keys(this.optionslist).length != 0){
			stream.write('<optionslist>' + '\n');
			for(var key_optlist in this.optionslist){
				if(this.optionslist.hasOwnProperty(key_optlist)){
					stream.write(key + ' ' + this.optionslist[key_optlist].join('/') + '\n');
				}
			}
			stream.write('</optionslist>' + '\n');
		}
		stream.end();
	}
}

module.exports = story;