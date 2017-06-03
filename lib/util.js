
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
	var time = new Date(link.time * 1000);
	var day = time.getDate()
	var month = time.getMonth() + 1;
	var year = time.getFullYear();
	var dh = year + '-' + month + '-' + day;
	if (!GD_time_data[dh]) {
		GD_time_data['days'].push(dh);
		GD_time_data[dh] = {}
		GD_time_data[dh]['date'] = link.time;
		GD_time_data[dh]['close'] = 0
	}
	GD_time_data[dh]['close'] += 1;
}

/**
 * 更新省份数据
 */
function process_province(node) {
	if (!GD_prov[node.province]) {
		GD_prov[node.province] = 0;
	}
	GD_prov[node.province] += 1;
	GD_prov['total'] += 1;
}

/**
 * 更新用户数目
 */
function update_user_num(uid) {
	if (GD_users.indexOf(uid) == -1) {
		GD_users.push(uid);
	}
}

/**
 * 添加一个节点
 * 如果没有父节点，则初始位置为svg中心，否则是父节点位置
 */
function add_node(node){
	if (node.target == "") { return; }
	node.id = node.target;
	GD_wbids.push(node.target);
	update_user_num(node.uid);
	var parent;
	if (node.source != '') {
		parent = GD_nodes[GD_wbids.indexOf(node.source)];
	}
	if (parent) {
		node.depth = GD_link_depth[node.source] + 1;
		if (!GD_node_level[node.depth]) {
			GD_node_level[node.depth] = []
		}
		GD_node_level[node.depth].push(node);
		node.parent = parent.parent + (parent.parent == "" ? "" : '-') + parent.target;
		node.x = parent.x;
		node.y = parent.y;
	} else { 	// 是根节点
		GD_node_level[0] = [node];
		node.depth = 0;
		node.parent = "";
		node.x = w/2;
		node.y = h/2;
	}
	// node.vx = 0;
	// node.vy = 0;
	node.childrenNum = 0;
	process_province(node);
	var len = GD_nodes.push(node);
	GDObject[node.id] = GD_nodes[len-1];
}

/**
 * 添加一个连接
 * 给父节点添加一个child
 */
function add_link(link){
	if (link.source == "") {
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
	var parent = GD_nodes[GD_wbids.indexOf(link.source)];
	parent && parent.childrenNum++;
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
	var base = 20;
	var min_child = 10;
	var begin = line.source.childrenNum;
	var end = line.target.childrenNum;
	var total = begin + end;
	if (total < min_child) {
		return base;
	}
	return base + (total-min_child)*0.5;
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
	var timer = d3.interval(function(){
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
	var base = 4;
	var l = node.childrenNum;
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
	G_nodes = G_nodes.enter().append("circle")
		.attr("class", function(d) { if (!d.index) { return "blink"; } })
		.attr("fill", function(d) { return color(d.depth); })
		.attr("r", get_node_size)
		.attr("id", function(d) { return d.id;})
		.attr("cx", 0)
		.attr("cy", 0)
		.merge(G_nodes)
		;

	// G_dispatch.call("new_node_created", this, node_enter);

	// // 更新所有节点
	G_nodes.attr("r", get_node_size);

	G_links = G_links.data(GD_links,  function(d) { return d.source + "-" + d.target;});
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
	update_left_num();
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

	// G_nodes
	// 	// .transition()
	// 	// .duration(100)
	// 	// .ease(d3.easeLinear)
	// 	.attr("transform", function(d) {
	// 		return "translate(" + d.x + "," + d.y + ")";
	// 	})
	// 	;

	// G_nodes
	// 	.attr("cx", function(d) {
	// 		return d.x = Math.max(radius, Math.min(w - radius, d.x));
	// 	})
	// 	.attr("cy", function(d) {
	// 		return d.y = Math.max(radius, Math.min(h - radius, d.y));
	// 	});

	G_nodes
		.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });
}