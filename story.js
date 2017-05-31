/*fragments of story to be stored in Story class, not accessable in export*/
class storySegment{
	/* lines - an array of strings to be said in the scene
	 * options - map of (string key, option object)
	 * option object - value pair (trigger[], destination)
	 */
	constructor(lines, options){
		if(arguments.length < 1){ //no lines
			this.lines = [];
			this.options = new Map();
		}else if(arguments.length < 2){ //no options
			this.lines = lines;
			this.options = new Map();
		}else{
			this.lines = lines;
			this.options = options;
		}
	}

	/*Adds a new option object to options*/
	addOption(key, destination, triggers = []){
		var option = {
			'triggers': triggers,
			'destination': value
		}
		this.options.set(key, option);
	}

	/*Adds new triggers to option*/
	addTrigger(key, triggers){
		var found = this.options.get(key);
		if(found === undefined){
			return;
		}
		found.triggers.push(triggers);
	}

	getDestination(key){
		return this.options.get(key).destination;
	}

	/*returns lines concatenated*/
	getKey(){
		var key;
		for (var i = 0; i < this.lines.length; i++) {
			key += this.lines[i];
		}
		return key;
	}

	/*member variables
	lines, options*/
}

/* main story data structure
 * storySegments is an options.length-ary tree
 * database of storySegments is stored as a hashset for easier access
 */
class Story{
	constructor(lines, options){
		if(arguments.length < 1){
			this.start = new storySegment();
		}else if(arguments.length < 2){
			this.start = new storySegment(lines);
		}else{
			this.start = new storySegment(lines, options);
		}
		this.current = this.start;
		var segments = new Map();
		segments.set(this.start.getKey(), this.start)
	}

	/*member functions*/
	/* Creates and adds a new segment, adds to segments*/ 
	addSegment(lines, options){
		var segment = new storySegment(lines, options);
		segments.set(lines, segment);
	}

	/*finds segment and adds option to it*/
	addOption(key, option){
		var segment = segments.get(key);
		if(segment === undefined){
			return;
		}
		segment.addOption(key, option);
	}

	/*deletes key-value pair internally*/
	delete(key){
		delete segments.get(key)
	}

	/* Connect seg1 to seg2 using key 'connector'
	 * seg1 and seg2 are identification strings */
	connect(seg1, seg2, connector, triggers = []){
		var seg1f = this.segments.get(seg1);
		var seg2f = this.segments.set(seg2);
		if(seg1f === undefined || seg2f === undefined){
			return;
		}
		seg1f.addOption(connector, seg2f, triggers);
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
	 * public - start, end, current
	 * private - segments
	 */
}

module.exports = Story;