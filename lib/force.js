var arr_color = ["#d62728", "#1f77b4", "#ff7f0e", "#2ca02c", "#9467bd", "#8c564b", "#e377c2",
				 "#ff9896", "#aec7e8", "#ffbb78", "#98df8a", "#c5b0d5", "#c49c94", "#f7b6d2"];
/**
 * 生成配色
 */
function color(depth) {
	var len = arr_color.length;
	if (depth > len) {
		return depth % len;
	}
	return arr_color[depth];
}

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
 * 更新其余全部信息
 */
function update_others() {
	update_map();
	update_left_num();
	process_province(node);
	// update_user_num(node.uid);
	// update_line_item();
	// update_time(link);
}

/////////////////////////////////////////////
//		下面是力导引布局相关的方法
/////////////////////////////////////////////

/**
 * @example: -1.9723055012918167
 */
function get_random_pos(){
	var random = Math.random() * -2;
	return random;
}

/**
 * 添加一个节点
 * 根节点初始位置为svg中心，子节点初始位置是父节点位置
 * ancestors: 为了高亮祖先节点, 包括从root到self的节点 id
 */
function add_node(node){
	if (node.id == "") { return; }
	if (node.parent != '') {
		var parent = GD_nodes[GD_wbids.indexOf(node.parent)];
		node.depth = parent['depth'] + 1;
		node.ancestors = parent.ancestors + '-' + node.id;
		node.x = parent.x;
		node.y = parent.y;
		// node.vx = get_random_pos();
		// node.vy = get_random_pos();
	} else { 	// 是根节点
		node.depth = 0;
		node.ancestors = node.id;
		// node.x = w/2;
		// node.y = h/2;
		node.fx = w/2;
		node.fy = h/2;
	}
	node.childrenNum = 0;
	GD_wbids.push(node.id);
	var len = GD_nodes.push(node);
	GDObject[node.id + ''] = GD_nodes[len-1];
}

/**
 * 添加一个连接
 * 当link.parent == ""时, 是根节点
 */
function add_link(link){
	if (link.parent == "") { return; }
	GD_links.push({
		'source': link.parent,
		'target': link.id
	});
	var parent = GD_nodes[GD_wbids.indexOf(link.parent)];
	parent && parent.childrenNum++;
}

/**
 * 高亮传播路径, 每个 node 上都存储着祖先元素(含自身)
 */
function hilight_spread_path(elem){
	var result = elem.dataset.ancestors.split('-');
	G_nodes.classed('blur', function(d){
		if (result.indexOf(d.id) == -1) {
			return true;
		}
	});
	G_links.classed('blur', function(l){
		if (result.indexOf(l.target.id) == -1) {
			return true;
		}
	});
}

/**
 * 清除高亮
 */
function clear_hilight(){
	G_nodes.classed('blur', false);
	G_links.classed('blur', false);
}

/**
 * 缩放
 * svg 直接子元素可缩放
 */
function zoomed() {
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
	var min = 10;
	var fathre = line.source.childrenNum;
	var me = line.target.childrenNum;
	var total = fathre + me;
	if (total < min) {
		return base;
	}
	if (fathre < min || me < min) {
		return base + (total-min)*0.3;
	}
	return base + (total-min)*0.7;
}

/**
 * 获得节点的半径
 */
function get_node_size(node) {
	var base = 4;
	var min_child = 20;
	var child_num = node.childrenNum;
	if (child_num < min_child) {
		return base;
	}
	return base + 0.005*(child_num - min_child);
}

/**
 * 力导引布局
 *
 * data() 方法里 return 的 d.id 和 d.index 不要修改.
 *
 * 如果是第一次添加的节点和链接, 则没有index属性.
 * 根据这个特性, 对新增的节点和链接做闪烁处理.
 */
function restart() {
	// 更新数据
	G_nodes = G_nodes.data(GD_nodes, function(d) { return d.id; });
	// 移除旧节点
	G_nodes.exit().remove();
	// 添加新节点
	G_nodes = G_nodes.enter().append("circle")
		.attr("class", function(d) { return "blink"; })
		.attr("fill", function(d) { return color(d.depth); })
		.attr("data-ancestors", function(d) { return d.ancestors; })
		.attr("id", function(d) { return "id-" + d.id; })
		.attr("uid", function(d) { return d.uid; })
		.attr("depth", function(d) { return d.depth; })
		.attr("r", get_node_size)
		.attr("cx", 0)
		.attr("cy", 0)
		.merge(G_nodes)
		;

	// 更新所有节点
	G_nodes.attr("r", get_node_size); ;

	G_links = G_links.data(GD_links,  function(d) { return d.index; });
	G_links.exit().remove();
	G_links = G_links.enter().append("line")
		.attr("class", function(l) { return "link blink"; })
		.merge(G_links)
		;

	// Update and restart the simulation.
	G_simulation.nodes(GD_nodes);
	G_simulation.force("link").links(GD_links);
	G_simulation.alpha(1);
	G_simulation.restart();
}

/**
 * 深度越大的节点，离心力越大
 */
function many_body_strength(node) {
	var charge = (node.depth+1);
	return -2*charge;
}

/**
 * 拖拽模块
 */
function dragsubject() {
	return G_simulation.find(d3.event.x, d3.event.y);
}
function dragstarted() {
	if (!d3.event.active) G_simulation.alphaTarget(0.3).restart();
	d3.event.subject.fx = d3.event.subject.x;
	d3.event.subject.fy = d3.event.subject.y;
}
function dragged() {
	d3.event.subject.fx = d3.event.x;
	d3.event.subject.fy = d3.event.y;
}
function dragended() {
	if (!d3.event.active) G_simulation.alphaTarget(0);
	d3.event.subject.fx = null;
	d3.event.subject.fy = null;
}

/**
 * 布局变换
 */
function ticked(d) {
	G_links
		.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; })
	;

	G_nodes
		.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; })
	;
}