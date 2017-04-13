importScripts("../lib/d3-v4.7.4.min.js");

onmessage = function(event) {
	var nodes = event.data.nodes,
		links = event.data.links;

	var simulation = d3.forceSimulation(nodes)
		.force("charge", d3.forceManyBody())
		.force("link", d3.forceLink(links).distance(20).strength(1).id(function(d, i){
			return d.id;
		}))
		.force("x", d3.forceX())
		.force("y", d3.forceY())
		// .force("center", d3.forceCenter(width / 2, height / 2))
		.stop();

	let min = simulation.alphaMin();	// 获取最小的 alpha 值
	let decay = simulation.alphaDecay(); 	// 获取衰减系数
	let n = Math.ceil(Math.log(min) / Math.log(1 - decay));

	for (var i = 0; i < n; ++i) {
		postMessage({type: "tick", progress: i / n});
		simulation.tick();
	}

	postMessage({type: "end", nodes: nodes, links: links});
};