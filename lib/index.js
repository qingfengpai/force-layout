
/**
 * 添加一个随机 id 的node
 */
function add_random_node(node){
	let id;
	while (true) {
		id = Math.round(Math.random() * 1000) + "";
		if (GD_wbids.indexOf(id) == -1) {
			GD_wbids.push(id);
			break;
		}
	}
	let new_node = {
		"id": id,
		"depth": node.depth + 1,
		"parent": node.id
	}
	add_node(new_node);
	let link = {
		"id": node.id + '-' + id,
		"source": node.id,
		"target": id
	}
	add_link(link);
	restart();
}

/**
 * 入口函数, 请求数据
 */
function main() {
	d3.request("../data/link.json")
		.mimeType("application/json")
		.response(function(xhr) {
			GD_data = JSON.parse(xhr.responseText);
		})
		.get()
	;
}

/**
 * 动态添加节点
 */
function process(data) {
	let per = 1000;
	let count = data.length;
	let index = 0;
	G_timer = setInterval(function(){
		let s = data[index]['source'];
		if (GD_wbids.indexOf(s.id) == -1) {
			add_node(s);
		}
		let t = data[index]['target'];
		if (GD_wbids.indexOf(t.id) == -1) {
			add_node(t);
		}
		add_link(data[index]['link']);
		index++;
		restart();
	}, per);

	setTimeout(function(){
		clearInterval(G_timer);
	}, per*count);
}

/**
 * 一次渲染全部
 */
function path(data) {
	let per = 1000;
	let count = data.length;
	let index = 0;
	for (var i = 0; i < count; i++) {
		let s = data[index]['source'];
		if (GD_wbids.indexOf(s.id) == -1) {
			add_node(s);
		}
		let t = data[index]['target'];
		if (GD_wbids.indexOf(t.id) == -1) {
			add_node(t);
		}
		add_link(data[index]['link']);
		index++;
	}
	restart();
}

function predict(data) {
	path(data);
}

/**
 * 不同场景对节点绑定不同类型的事件
 */
function new_node_created(nodes) {
	switch (G_scene) {
		case "path":
			nodes.on("mouseover", hilight_spread_path)
				 .on("mouseout", clear_hilight)
				 .on("click", null)
			; break ;
		case "process":
			nodes.on("mouseover", null)
				 .on("mouseout", null)
				 .on("click", null)
			; break ;
		case "predict":
			nodes.on("mouseover", null)
				 .on("mouseout", null)
				 .on("click", predict_retweet)
			; break ;
	}
}

function predict_retweet(d){
	console.log(d);
	add_random_node(d);
}

/**
 * 高亮传播路径
 */
function hilight_spread_path(d){
	console.log(d);
	let depth = d.depth;
	let parent = d.parent;
	let result = [d.id];
	while (parent != "null") {
		GD_node_level[--depth].forEach(function(item, index){
			if (item.id == parent) {
				result.push(parent);
				parent = item.parent;
			}
		})
	}
	console.log(result);
	G_nodes.classed('hide', function(d){
		if (result.indexOf(d.id) == -1) {
			return true;
		}
	});
	G_links.classed('hide', function(l){
		st = l.id.split('-')
		if (result.indexOf(st[0]) == -1 || result.indexOf(st[1]) == -1) {
			return true;
		}
	})
}

/**
 * 清除高亮
 */
function clear_hilight(){
	G_nodes.classed('hide', false);
	G_links.classed('hide', false);
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
	} else { 	// 是根节点
		GD_node_level[0] = [node];
		node.depth = 0;
		node.x = w/2;
		node.y = h/2;
	}
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
	GD_links.push(link);
	let parent = GD_nodes[GD_wbids.indexOf(link.source)];
	let child = link.target;
	if (parent && parent.children.indexOf(child) == -1) {
		parent.children.push(child);
	}
}