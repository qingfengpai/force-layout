
/**
 * 设置link的强度
 */
function strength(link) {
	return 1;
}

/**
 * 连线的长度
 */
function distance(line) {
	let begin = line.source.children.length;
	let end = line.target.children.length;
	let total = begin + end;
	if (total < 3) {
		return 20;
	}
	return 20 + total*2;
}

/**
 * 缩放
 */
function zoomed() {
	// svg 直接子元素可缩放
	G_g.attr("transform", d3.event.transform);
}

/**
 * 节点配色
 */
function get_color(d) {
	var color = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
	return color[d.depth];
}

// 拖动事件
function dragged() {
	d3.event.subject.x = d3.event.x;
	d3.event.subject.y = d3.event.y;
}

function ticked() {
	// node.attr("transform", function(d) {
	// 	return "translate(" + d.x + "," + d.y + ")";
	// });

	G_node.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });

	G_link.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });
}

function main() {
	let node_list = [];
	let nodes_data = [];
	let links_data = [];

	function process(data) {
		data.forEach(function(item, index){
			let arr = item.chain.split(' ');
			arr.forEach(function(u, i){
				// 节点处理
				if (node_list.indexOf(u) == -1) {
					node_list.push(u);
					let node = {
						"name": u,
						"depth": i,
						"children": []
					}
					nodes_data.push(node);
				}
				// 处理根元素
				if (i == 0) return;
				let source = nodes_data[node_list.indexOf(arr[i-1])];
				let target = nodes_data[node_list.indexOf(u)];
				let link = {
					"source": source,
					"target": target
				};
				links_data.push(link);

				if (source.children.indexOf(target) == -1) {
					source.children.push(target);
				}
			});
		});
		G_nodes = nodes_data;
		G_links = links_data;
		restart();
	}

	function test(data) {
		// let data1 = [];
		// for (var i = data.length - 1; i >= 8; i--) {
		// 	data1.push(data[i]);
		// }
		// process(data1);

		// setTimeout(function(){
		// 	let data2 = [];
		// 	for (var i = data.length - 1; i >= 4; i--) {
		// 		data2.push(data[i]);
		// 	}
		// 	process(data2);
		// }, 4000);

		// setTimeout(function(){
		// 	process(data)
		// }, 8000);

		process(data)
	}

	d3.request("../data/data.json")
		.mimeType("application/json")
		.response(function(xhr) {
			let data = JSON.parse(xhr.responseText);
			test(data.data);
		})
		.get()
	;
}


/**
 * 节点点击
 */
function click(node) {
	console.log(node);
}


/**
 * 获得节点的半径
 */
function get_node_size(node) {
	let l = node.children.length;
	if (l < 2) {
		return 4
	}
	return 4 + 1.5*(l-2);
}

/**
 * 力导引布局
 */
function restart() {
	// Apply the general update pattern to the nodes.
	G_node = G_node.data(G_nodes, function(d) { return d.id;});

	// 移除旧节点
	G_node.exit().remove();

	// 添加新节点
	G_node = G_node.enter().append("circle")
		.attr("fill", function(d) { return get_color(d); })
		.attr("class", function(d) { if (!d.index) { return "show"; } })
		.attr("r", get_node_size)
		.on("click", function(d){
			console.log("hah");
		})
		.call(d3.drag().on("drag", dragged))
		.merge(G_node);

	// 更新所有节点
	G_node.attr("r", get_node_size)

	// Apply the general update pattern to the links.
	G_link = G_link.data(G_links,  function(d) {
					return d.source.id + "-" + d.target.id;});

	// Keep the exiting links connected to the moving remaining nodes.
	G_link.exit().remove();

	// new add line
	G_link = G_link.enter().append("line")
		.attr("class", "line")
		.merge(G_link);

	// Update and restart the simulation.
	G_simulation.nodes(G_nodes);
	G_simulation.force("link").links(G_links);
	G_simulation.alpha(1).restart();
}