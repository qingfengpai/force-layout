


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
	let base = 20;
	let begin = line.source.children.length;
	let end = line.target.children.length;
	let total = begin + end;
	if (total < 3) {
		return base;
	}
	return base + total-3;
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
	return "#333";
	var color = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
	return color[d.depth];
}


/**
 * 节点点击
 */
function node_click(node) {
	console.log(node);
	let timer = d3.interval(function(){
		var len = GD_nodes.length - 1;
		var i = Math.round(Math.random()*len);
		if (i > len) {return;}
		add_random_node(GD_nodes[i]);
	}, 6000);

	d3.interval(function(){
		console.log(GD_nodes.length);
	}, 5000);
}

/**
 * 获得节点的半径
 */
function get_node_size(node) {
	return 8;
	let base = 8;
	let l = node.children.length;
	if (l < 2) {
		return base;
	}
	return base + 1.5*(l-2);
}


// /**
//  * 拖动事件
//  */
// function dragged(d) {
// 	// d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
// 	d3.event.subject.x = d3.event.x;
// 	d3.event.subject.y = d3.event.y;
// }

function dragstarted(d) {
	if (!d3.event.active) {
		G_simulation.alphaTarget(0.3).restart();
	}
	d.fx = d.x;
	d.fy = d.y;
}

function dragged(d) {
	d.fx = d3.event.x;
	d.fy = d3.event.y;
}

function dragended(d) {
	if (!d3.event.active) {
		G_simulation.alphaTarget(0);
	}
	d.fx = null;
	d.fy = null;
}


/**
 * 力导引布局
 */
function restart() {
	// 更新数据
	G_nodes = G_nodes.data(GD_nodes, function(d) { return d.id;});

	// 移除旧节点
	G_nodes.exit().remove();

	// 添加新节点
	var node_enter = G_nodes.enter().append("g")
		.attr("class", function(d) { if (!d.index) { return "show"; } })
		;
	node_enter.append("circle")
		.attr("fill", get_color)
		.attr("r", get_node_size)
		;
	// node_enter.append("text")
	// 	.attr("class", "userid")
	// 	.text(function(d) { return d.id; })
	// 	;

	G_dispatch.call("new_node_created", this, node_enter);

	G_nodes = node_enter.merge(G_nodes);

	// 更新所有节点
	G_nodes.attr("r", get_node_size);

	G_links = G_links.data(GD_links,  function(d) { return d.source.id + "-" + d.target.id;});
	G_links.exit().remove();
	G_links = G_links.enter().append("line")
		.attr("class", "line")
		.merge(G_links)
		;

	G_simulation.stop();

	// Update and restart the simulation.
	G_simulation.nodes(GD_nodes);
	G_simulation.force("link").links(GD_links);
	G_simulation.alpha(1);
	G_simulation.restart();
}

/**
 * 清除上一个场景的布局
 */
function clear_layout() {
	GD_nodes = [];
	GD_links = [];
	GD_wbids = [];
	GD_link_depth = [];

	G_nodes = G_nodes.data(GD_nodes);
	G_nodes.exit().remove();

	G_links = G_links.data(GD_links);
	G_links.exit().remove();

	G_simulation.stop();
	G_simulation.nodes(GD_nodes);
	G_simulation.force("link").links(GD_links);
	G_simulation.alpha(1);
	G_simulation.restart();
}


function ticked(d) {
	G_links
		.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });

	G_nodes.attr("transform", function(d) {
		return "translate(" + d.x + "," + d.y + ")";
	});

	// G_nodes
	// 	.attr("cx", function(d) { return d.x; })
	// 	.attr("cy", function(d) { return d.y; });
}