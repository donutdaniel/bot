// vis is loaded through the .pug file
var init = function(){
	draw();
}

var draw = function(){
	var nodes = new vis.DataSet;
	var edges = new vis.DataSet;
	var container = document.getElementById('graph');
	for(var key_seg in story.segments){
		if(story.segments.hasOwnProperty(key_seg)){
			var segment_ = story.segments[key_seg];
			nodes.add({
				id: segment_.id,
				label: segment_.id
			});
			for(var key_opt in segment_.options){
				if(segment_.options.hasOwnProperty(key_opt)){
					var option_ = segment_.options[key_opt];
					edges.add({
						from: segment_.id,
						to: option_.destinationKey,
						label: key_opt,
						arrows: 'to'
					})
				}
			}
			if(segment_.jump.jumpKey != undefined){
				edges.add({
					from:segment_.id,
					to: segment_.jump.jumpKey,
					arrows: 'to',
					color: 'rgb(230, 140, 100)'
				})
			}
		}
	}
	var data = {
	    nodes: nodes,
	    edges: edges
	};
	var options = {};
	// init network
	var network = new vis.Network(container, data, options);
}