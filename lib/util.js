
/**
 * 更新地图颜色的深度
 */
function update_map(){
	var color = ['#3dc7f4', '#6acae9', '#92cfe3', '#b5d7e3', '#d3e2e7', '#ebeff0'];
	var paths = d3.select("#map").selectAll("path");
	paths.attr("fill", function(d, i){
		if (GD_prov[d.properties.id]) {
			var prec = GD_prov[d.properties.id] / GD_prov['total'];
			return color[Math.ceil(prec * 6)]
		}
		return "#aec7e8";
	})
}

function update_time(link){
	let time = new Date(link.time * 1000);
	let day = time.getDate()
	let month = time.getMonth() + 1;
	let year = time.getFullYear();
	let dh = year + '-' + month + '-' + day;
	if (!GD_time_data[dh]) {
		GD_time_data['days'].push(dh);
		GD_time_data[dh] = {}
		GD_time_data[dh]['date'] = link.time;
		GD_time_data[dh]['close'] = 0
	}
	GD_time_data[dh]['close'] += 1;
}

function process_province(node) {
	if (!GD_prov[node.province]) {
		// var parent = GD_nodes[GD_wbids.indexOf(node.parent)];
		// console.log(node.province, node);
		GD_prov[node.province] = 0;
	}
	GD_prov[node.province] += 1;
	GD_prov['total'] += 1;
}

/**
 * 添加一个节点
 * 如果没有父节点，则初始位置为svg中心，否则是父节点位置
 */
function add_node(node){
	if (node.id == "null") { return; }
	GD_wbids.push(node.id);
	let parent;
	if (node.parent != 'null') {
		parent = GD_nodes[GD_wbids.indexOf(node.parent)];
	}
	if (parent) {
		node.depth = GD_link_depth[node.parent] + 1;
		if (!GD_node_level[node.depth]) {
			GD_node_level[node.depth] = []
		}
		GD_node_level[node.depth].push(node);
		node.x = parent.x;
		node.y = parent.y;
		node.vx = 0;
		node.vy = 0;
	} else { 	// 是根节点
		GD_node_level[0] = [node];
		node.depth = 0;
		node.x = w/2;
		node.y = h/2;
		node.vx = 0;
		node.vy = 0;
	}
	process_province(node);
	node.children = [];
	GD_nodes.push(node);
}

/**
 * 添加一个连接
 * 给父节点添加一个child
 */
function add_link(link){
	if (link.id.indexOf('null') > -1) {
		GD_link_depth[link.target] = 0;
		return;
	}
	if (!GD_link_depth[link.target]) {
		GD_link_depth[link.target] = GD_link_depth[link.source] + 1;
	}
	if (!link.type) {
		link.type = "line";
	}
	update_time(link);
	GD_links.push(link);
	let parent = GD_nodes[GD_wbids.indexOf(link.source)];
	let child = link.target;
	if (parent && parent.children.indexOf(child) == -1) {
		parent.children.push(child);
	}
}

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
	return base + (total-3)*1.5;
}

/**
 * 缩放
 */
function zoomed() {
	// svg 直接子元素可缩放
	G_g.attr("transform", d3.event.transform);
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
	return 4;
	let base = 4;
	let l = node.children.length;
	if (l < 2) {
		return base;
	}
	return base + 0.25*(l-2);
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
		.attr("fill", function(d) { return color(d.depth); })
		.attr("r", get_node_size)
		.attr("cx", 0)
		.attr("cy", 0)
		;
	// node_enter.append("text")
	// 	.attr("class", "userid")
	// 	.text(function(d) { return d.id; })
	// 	;

	G_dispatch.call("new_node_created", this, node_enter);

	G_nodes = node_enter.merge(G_nodes);

	// 更新所有节点
	let cicles = G_g.selectAll("circle");
	cicles.attr("r", get_node_size);

	G_links = G_links.data(GD_links,  function(d) { return d.source.id + "-" + d.target.id;});
	G_links.exit().remove();
	G_links = G_links.enter().append("line")
		.attr("class", function(l) { return l.type; })
		.merge(G_links)
		;

	G_simulation.stop();

	// Update and restart the simulation.
	G_simulation.nodes(GD_nodes);
	G_simulation.force("link").links(GD_links);
	G_simulation.alpha(1);
	G_simulation.restart();

	update_map();
	// update_line_item();
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
	G_simulation.alphaTarget(0);
}


function ticked(d) {
	G_links
		.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });

	G_nodes
		// .transition()
		// .duration(100)
		// .ease(d3.easeLinear)
		.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")";
		})
		;

	// G_nodes
	// 	.attr("cx", function(d) {
	// 		return d.x = Math.max(radius, Math.min(w - radius, d.x));
	// 	})
	// 	.attr("cy", function(d) {
	// 		return d.y = Math.max(radius, Math.min(h - radius, d.y));
	// 	});

	// G_nodes
	// 	.attr("cx", function(d) { return d.x; })
	// 	.attr("cy", function(d) { return d.y; });
}