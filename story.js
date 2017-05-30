
/*fragments of story to be stored in Story class, not accessable in export*/
class storySegment{
	/*lines - an array of strings to be said in the scene
	option - map of (string, destination segment)*/
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
	addOption(key, value){
		this.options.set(key, value);
	}
}

/* main story data structure, storySegments is an options.length-ary tree
 * database of storySegments is stored as a set (or hash table?) for easier access
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
		this.segments = [this.start];
	}

	/*member functions*/

	/*creates and adds a new segment, adds to segments*/ 
	add(lines, options){
		var segment = new storySegment(lines, options);
	}

	/*for each segment in seg1, connects to all segments in seg2*/
	connect(seg1, seg2){
		segA = [];
		segB = [];
		var found;

		//preprocess seg1 and 2
		for (var i = 0; i < seg1.length; i++) {
			found = segments.get(seg1[i]);
			if(found != undefined){
				segA.push(found);
			}
		}
		for (var i = 0; i < seg2.length; i++) {
			found = segments.get(seg2[i]);
			if(found != undefined){
				segB.push(found);
			}
		}

		for(var i=0; i<segA.length; i++){
			for(var j=0; j<segB.length; j++){
				segments.find()
			}
		}
	}

	proceed(key){
		var destination = this.currentSegment.options.get(key);
		if(destination != undefined){
			this.currentSegment = destination;
		}
	}

	/*member variables:
	 * start, end, current
	 * segments
	 */
}

module.exports = Story;