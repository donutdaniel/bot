// vis is loaded through the .pug file
var init = function(){
	draw();
}

var draw = function(){
	var nodes = new vis.DataSet;
	var edges = new vis.DataSet;
	var container = document.getElementById('graph');
	console.log(story);
	story.segments.forEach(function(value_segment, key_segment, map_segment){
		nodes.add({
			id: value_segment.id,
			label: value_segment.id
		});
		value_segment.options.forEach(function(value_option, key_option, map_option){
			edges.add({
				from: value_segment.id,
				to: value_option.destinationKey,
				label: key_option
			});
		});
	});
	var data = {
	    nodes: nodes,
	    edges: edges
	};
	var options = {};
	// init network
	var network = new vis.Network(container, data, options);
}