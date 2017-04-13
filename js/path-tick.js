importScripts("../lib/d3-v4.7.4.min.js");

var width = 960;
var height = 600;

var G_simulation = d3.forceSimulation()
	.force("charge", d3.forceManyBody())
	.force("link", d3.forceLink().distance(20).strength(1)
		.id(function(d, i){ return d.id; }))
	.force("x", d3.forceX())
	.force("y", d3.forceY())
	.force("center", d3.forceCenter(width/2, height/2))
	;

onmessage = function(event) {
	var nodes = event.data.nodes,
		links = event.data.links;

	G_simulation.nodes(nodes);
	G_simulation.force("link").links(links);
	G_simulation.stop();

	var min = G_simulation.alphaMin();		// 获取最小的 alpha 值
	var decay = G_simulation.alphaDecay(); 	// 获取衰减系数
	var n = Math.ceil(Math.log(min) / Math.log(1 - decay));

	for (var i = 0; i < n; ++i) {
		postMessage({type: "tick", progress: i/n});
		G_simulation.tick();
	}

	postMessage({type: "end", nodes: nodes, links: links});
};