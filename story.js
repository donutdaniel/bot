/*fragments of story to be stored in Story class, not accessable in export*/
class storySegment{
	/* lines - an array of strings to be said in the scene
	 * options - map of (string key, option object)
	 * option object - value pair (trigger[], destination)
	 */
	constructor(lines = [], options = new Map(), jump = null){
		this.lines = lines;
		this.options = options;
		this.jump = jump;
	}

	/*Adds a new option object to options*/
	addOption(key, destination, triggers = []){
		var option = new Object();
		option.destinationKey = destination;
		option.triggers = triggers;
		option.destination = undefined; //needs to be connected through story
		this.options.set(key, option);
	}

	/*Adds new triggers to option*/
	addTrigger(key, triggers){
		var found = this.options.get(key);
		if(found != undefined){
			found.triggers.push(triggers);
		}

	}

	addJump(jump){
		this.jump = jump;
	}

	getDestination(key){
		return this.options.get(key).destination;
	}

	/*member variables
	lines, options, jump*/
}

/* main story data structure
 * storySegments is an options.length-ary tree
 * database of storySegments is stored as a hashset for easier access
 */
class Story{
	constructor(key, lines, options){
		this.segments = new Map();
		if(arguments.length < 1){
			this.start = null;
		}else if(arguments.length < 2){
			this.start = new storySegment();
			this.segments.set(key, this.start);
		}else if(arguments.length < 3){
			this.start = new storySegment(lines);
			this.segments.set(key, this.start);
		}else{
			this.start = new storySegment(lines, options);
			this.segments.set(key, this.start);
		}
		this.current = this.start;
	}

	/*member functions*/
	/* Creates and adds a new segment, adds to segments*/ 
	addSegment(id, lines, options, jump){
		var segment = new storySegment(lines, options, jump);
		this.segments.set(id, segment);
		if(this.start === null){
			this.start = segment;
		}
	}

	/*finds segment and adds option to it*/
	addOption(key, option){
		var segment = this.segments.get(key);
		if(segment != undefined){
			segment.addOption(key, option);
		}
	}

	/*deletes key-value pair internally*/
	delete(key){
		delete this.segments.get(key)
	}

	/*connect all the segments using key identification. Run after adding all the segments*/
	connect(){
		this.segments.forEach(function(value, key, map){
			value.options.forEach(function(value_o, key_o, map_o){
				var destSeg = map.get(value_o.destinationKey);
				value_o.destination = destSeg;
			});
		});
	}

	/*follows with proceed key and returns the next segment*/
	proceed(key){
		var destination = this.currentSegment.options.get(key).destination;
		if(destination != undefined){
			this.currentSegment = destination;
		}
		return currentSegment;
	}

	/*member variables:
	 * start, current, name, description
	 * map of segments
	 */
}

module.exports = Story;