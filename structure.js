/*fragments of story to be stored in structure class, not accessable in export*/
class segment{
	/* lines - an array of strings to be said in the scene
	 * options - map of (string key, string destination)
	 * option object - destinationKey, destination
	 */
	constructor(lines = [], options = new Map(), jumpKey = null){
		this.lines = lines;
		this.options = options;
		this.jumpKey = jumpKey;
		this.jump = undefined;
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
		this.options.set(key, option);
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
	constructor(name, description, key, lines, options, id, version){
		this.segments = new Map();
		this.optionslist = new Map();
		if(arguments.length < 3){
			this.start = null;
		}else if(arguments.length < 4){
			this.start = new segment();
			this.segments.set(key, this.start);
		}else if(arguments.length < 5){
			this.start = new segment(lines);
			this.segments.set(key, this.start);
		}else{
			this.start = new segment(lines, options);
			this.segments.set(key, this.start);
		}
		this.current = this.start;
		this.name = name;
		this.description = description;
		this.id = id;
		this.version = version;
	}

	/*member functions*/
	/* Creates and adds a new segment, adds to segments*/ 
	addSegment(id, lines, options, jumpKey){
		var tempSegment = new segment(lines, options, jumpKey);
		this.segments.set(id, tempSegment);
		if(this.start === null){
			this.start = tempSegment;
			this.current = this.start;
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
	proceed(key){
		var next = this.current.options.get(key);
		if(next != undefined){
			next = next.destination;
			this.current = next;
			return true;
		}else{
			return false;
		}
	}

	/*member variables:
	 * start , current, name, description, id
	 * segments [map (id, segment reference)]
	 * optionslist [map (option name, triggers)]
	 */
}

module.exports = structure;