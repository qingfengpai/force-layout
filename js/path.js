
/**
 * 一个微博只可能转自另一条微博, 他们是一对一的关系
 */
function extract_nodes(response){
	var nodes = [];
	var ids_dict = {};
	var data = JSON.parse(response);
	var n = data.length;
	for (var i = 0; i < n; i++) {
		var item = data[i];
		var id = item.target;
		var prev = item.source;
		var index;
		var node = {};
		var pnode;			//父节点
		if (ids_dict[id]) {	continue; }
		node["id"] = id
		if (prev == "null") { 	// 是根节点
			node["ancestor"] = "null";
			node["depth"] = 0;
		} else {			// 不是根节点
			var pindex = ids_dict[prev];
			pnode = nodes[pindex];
			node["ancestor"] = pnode["ancestor"] + "," + pnode["id"];
			node["depth"] = pnode["depth"] + 1;
		}
		index = nodes.push(node)
		ids_dict[id] = index - 1;
	}
	return nodes;
}

/**
 * 鼠标离开node, G_curr_node 为空
 * 鼠标在一个node范围内活动，忽略
 */
function mousemoved() {
	var m = d3.mouse(this);
	var node = get_focus_node(m);
	if (!node) {			// 不在node上
		if (G_curr_node) {	// 刚才在node上
			G_curr_node = null;
			clear_hilight();
		}
		return;
	}
	if (!G_curr_node) { G_curr_node = node; }
	else if (G_curr_node.id === node.id) { return; }
	G_curr_node = node;
	console.log("mouseover: ", node);
	var nids = node.ancestor.split(",")
	nids.shift(); 			// 删除第一个元素 null, 没有意义
	nids.push(node.id);		// 把自身添加进去
	console.log("mouseover: ", nids);
	hilight_path(nids);
}

/**
 * 高亮祖先节点和路径
 * 高亮一个节点，就把它从nids中取出，当nids的长度为0时，结束遍历
 */
function hilight_path(nids){
	var lines = JSON.parse(JSON.stringify(nids));
	for (var i = 0, n = GD_data.nodes.length; i < n; i++) {
		var item = GD_data.nodes[i];
		var k = nids.indexOf(item.id);
		if (k > -1) {
			item.color = "hilight";
			nids.splice(k, 1);
			if (nids.length == 0) { break; }
		}
	}

	var hlinks = [];		// 高亮的links
	var length = lines.length - 1;
	lines.forEach(function(item, index) {
		if (index == length) { return; }
		hlinks.push( item + "-" + lines[index + 1] );
	});

	for (var i = 0, n = GD_data.links.length; i < n; i++) {
		var item = GD_data.links[i];
		var k = hlinks.indexOf(item.id);
		if (k > -1) {
			item.color = "hilight";
			hlinks.splice(k, 1);
			if (hlinks.length == 0) { break; }
		}
	}
	redraw();
}

/**
 * 清除全部高亮
 */
function clear_hilight(){
	GD_data.nodes.forEach(function(item, index){
		item.color = "";
	});
	GD_data.links.forEach(function(item, index){
		item.color = "";
	});
	redraw();
}

/**
 * 获得当前鼠标所在的node
 */
function get_focus_node(m) {
	var x = transform.invertX(m[0]);
	var y = transform.invertY(m[1]);
	var node = G_simulation.find(x, y, radius);
	return node;
}

/**
 * 缩放
 */
function zoom() {
	transform = d3.event.transform;
	redraw();
}

/**
 * 重新绘图
 */
function redraw() {
	var nodes = GD_data.nodes,
	  	links = GD_data.links;

	meter.style.display = "none";

	context.save();
	context.clearRect(0, 0, width, height);
	context.translate(transform.x, transform.y);
	context.scale(transform.k, transform.k);

	links.forEach(drawLink);
	nodes.forEach(drawNode);

	context.restore();
}

/**
 * 画线
 */
function drawLink(l) {
	context.beginPath();
	context.moveTo(l.source.x, l.source.y);
	context.lineTo(l.target.x, l.target.y);
	if (l.color == "hilight") {
		console.log(l)
		context.strokeStyle = "#e6550d";
	} else {
		context.strokeStyle = "#aaa";
	}
	context.stroke();
}

/**
 * 画点
 */
function drawNode(d) {
	context.beginPath();
	context.moveTo(d.x + 3, d.y);
	context.arc(d.x, d.y, 3, 0, radius*Math.PI);
	if (d.color == "hilight") {
		context.fillStyle = "#e6550d";
	} else {
		context.fillStyle = "#333";
	}
	context.fill();
	context.stroke();
}