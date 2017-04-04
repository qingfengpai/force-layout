/**
 * 初始化
 */
function initialize() {
	create_arrow();
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

// 创建箭头
function create_arrow() {
	var defs = G_svg.append("defs");
	var arrow_path = "M2,2 L10,6 L2,10 L6,6 L2,2";
	var arrowMarker = defs.append("marker")
		.attr("id","arrow")
		.attr("markerUnits","strokeWidth")
		.attr("markerWidth","6")
		.attr("markerHeight","12")
		.attr("viewBox","0 0 12 12")
		.attr("refX","18")
		.attr("refY","6")
		.attr("orient","auto");
	arrowMarker.append("path")
		.attr("d",arrow_path)
		.attr("fill","#333");
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

/**
 * 节点点击
 */
function node_click(node) {
	console.log(node);
}

function main() {
	let node_list = [];
	let nodes_data = [];
	let links_data = [];

	function test(data) {
		data.forEach(function(item, index){
			let arr = item.chain.split(' ');
			arr.forEach(function(u, i){
				// 节点处理
				if (node_list.indexOf(u) == -1) {
					node_list.push(u);
					let node = {
						"name": u,
						"depth": i,
						"children": 0
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
				while (i > 0) {
					let parent_node = nodes_data[node_list.indexOf(arr[i-1])];
					parent_node.children++;
					i--;
				}
			});
		});
		console.log(node_list, nodes_data, links_data);
		G_nodes = nodes_data;
		G_links = links_data;
		restart();
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
 * 力导引布局
 */
function restart() {
	// Apply the general update pattern to the nodes.
	G_node = G_node.data(G_nodes, function(d) { return d.id;});

	G_node.exit().transition()
		.attr("r", 0)
		.remove();

	G_node = G_node.enter().append("circle")
		.attr("fill", function(d) { return get_color(d); })
		.attr("data-d", function(d) { return d.id; })
		.attr("r", function(d) {
			// if (d.children) {
				// return (d.children+1)*2;
			// }
			// return 8;
			return 4 * (d.children+1)
		})
		.on("click", node_click)
		.call(d3.drag().on("drag", dragged))
		.merge(G_node);

	// Apply the general update pattern to the links.
	G_link = G_link.data(G_links, function(d) {
			return d.source.id + "-" + d.target.id; });

	// Keep the exiting links connected to the moving remaining nodes.
	G_link.exit().transition()
		.attr("stroke-opacity", 0)
		.attrTween("x1", function(d) { return function() { return d.source.x; }; })
		.attrTween("x2", function(d) { return function() { return d.target.x; }; })
		.attrTween("y1", function(d) { return function() { return d.source.y; }; })
		.attrTween("y2", function(d) { return function() { return d.target.y; }; })
		.remove();

	G_link = G_link.enter().append("line")
		.attr("stroke", "#333")
		.attr("stroke-width", 1)
		.attr("marker-end","url(#arrow)") // 添加箭头
		.call(function(link) {
			G_link.transition().attr("stroke-opacity", 1);
		})
		// .linkDistance([30])
		.merge(G_link);

	// Update and restart the simulation.
	G_simulation.nodes(G_nodes);
	G_simulation.force("link").links(G_links);
	G_simulation.alpha(1).restart();
}