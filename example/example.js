var w=400;
var h=400;


var svg=d3.select("body").append("svg");

svg.attr('width',w)
	.attr('height',h);

// ensures branches sit beneath leaves
svg.append("g").attr("id", "branches")
svg.append("g").attr("id", "leaves")

function new_node(id){
	this.id=id;
	this.x=w/2;
	this.y=h/2;
}
function new_link(source,target){
	this.source = source;
	this.target = target;
}

var nodes = [];
var links = [];

var node;
var circles;
var link;
var simulation = d3.forceSimulation()
	.force("link", d3.forceLink().distance(100).id(function(d) { return d.id; }))
	.force("charge", d3.forceManyBody().strength(-1000))
	.force("xPos", d3.forceX(w/2))
	.force("yPos", d3.forceY(h/2))
	.on('tick',ticked);

simulation.stop();

var newNode = new new_node(0);
nodes.push(newNode);

for (var i=1;i<3;i++){
	if (i==3) continue;
	addLeaf(0,i)
}

function addLeaf(rootId,newId){
	var newNode = new new_node(newId);
	nodes.push(newNode);

	var newLink = new new_link(rootId,newId);
	links.push(newLink);

	//adds newest branch and draws it
	link = svg.select("#branches").selectAll(".link")
	.data(links)

	var linkEnter = link.enter().append("line")
						.attr("class","link");
	link = linkEnter.merge(link);

	//adds newest leaf
	node = svg.select("#leaves").selectAll(".node")
			  .data(nodes)
	var nodeEnter = node.enter().append("g")
						.attr("class","node");

	//draws circle on newest leaf
	var circlesEnter=nodeEnter.append('circle')

	node = nodeEnter.merge(node);
	circles = d3.selectAll('circle');

	simulation.stop();

	simulation.nodes(nodes);

	simulation.force("link")
	.links(links);

	simulation.alpha(1);

	restartSim();
}

//starts up the simulation and sets up the way the leaves react to interaction
function restartSim(){
  simulation.restart();

  circles.on('mouseover',function(d,i){
	addLeaf(i,nodes.length)
  })
}

function ticked() {
  link
	.attr("x1", function(d) { return d.source.x; })
	.attr("y1", function(d) { return d.source.y; })
	.attr("x2", function(d) { return d.target.x; })
	.attr("y2", function(d) { return d.target.y; });

  node.attr("transform", function(d) {
  	return "translate(" + d.x + "," + d.y + ")";
  });
}
