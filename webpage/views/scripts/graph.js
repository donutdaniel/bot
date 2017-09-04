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
	var locales = {
	  en: {
	    edit: 'Edit',
	    del: 'Delete selected',
	    back: 'Back',
	    addNode: 'Add Node',
	    addEdge: 'Add Edge',
	    editNode: 'Edit Node',
	    editEdge: 'Edit Edge',
	    addDescription: 'Click in an empty space to place a new node.',
	    edgeDescription: 'Click on a node and drag the edge to another node to connect them.',
	    editEdgeDescription: 'Click on the control points and drag them to a node to connect to it.',
	    createEdgeError: 'Cannot link edges to a cluster.',
	    deleteClusterError: 'Clusters cannot be deleted.',
	    editClusterError: 'Clusters cannot be edited.'
	  }
	}
	var options = {
		autoResize: true,
		height: '100%',
		width: '100%',
		locale: 'en',
		clickToUse: false,
		interaction: {
	    dragNodes:true,
	    dragView: false,
	    hideEdgesOnDrag: false,
	    hideNodesOnDrag: false,
	    hover: false,
	    hoverConnectedEdges: true,
	    keyboard: {
	      enabled: true,
	      speed: {x: 10, y: 10, zoom: 0.02},
	      bindToWindow: true
	    },
	    multiselect: true,
	    navigationButtons: true,
	    selectable: true,
	    selectConnectedEdges: true,
	    tooltipDelay: 300,
	    zoomView: true
		},
		manipulation: {
	    enabled: true,
	    initiallyActive: false,
	    addNode: function(data, callback){
        document.getElementById('operation').innerHTML = "Add Node";
        document.getElementById('node-id').value = data.id;
        document.getElementById('node-label').value = data.label;
        document.getElementById('saveButton').onclick = saveData.bind(this, data, callback);
        document.getElementById('cancelButton').onclick = clearPopUp.bind();
        document.getElementById('graph-popUp').style.display = 'block';
	    },
	    addEdge: function(data, callback){
        if (data.from == data.to) {
          var r = confirm("Do you want to connect the node to itself?");
          if (r == true) {
            callback(data);
          }
        }
        else {
          callback(data);
        }
      },
	    editNode: function(data, callback){
        // filling in the popup DOM elements
        document.getElementById('operation').innerHTML = "Edit Node";
        document.getElementById('node-id').value = data.id;
        document.getElementById('node-label').value = data.label;
        document.getElementById('saveButton').onclick = saveData.bind(this, data, callback);
        document.getElementById('cancelButton').onclick = cancelEdit.bind(this,callback);
        document.getElementById('graph-popUp').style.display = 'block';
      },
	    editEdge: true,
	    deleteNode: true,
	    deleteEdge: true,
	    controlNodeStyle:{
	      // all node options are valid.
	    }
		},
		physics: {}
	};
	// init network
	var network = new vis.Network(container, data, options);
}

function clearPopUp(){
  document.getElementById('saveButton').onclick = null;
  document.getElementById('cancelButton').onclick = null;
  document.getElementById('graph-popUp').style.display = 'none';
}

function cancelEdit(callback){
  clearPopUp();
  callback(null);
}

function saveData(data,callback){
  data.id = document.getElementById('node-id').value;
  data.label = document.getElementById('node-label').value;
  clearPopUp();
  callback(data);
}

function init(){
  setDefaultLocale();
  draw();
}