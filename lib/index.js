
/**
 * 格式化数据
 */
function format(data) {
	let new_data = [];
	let origin = [];
	data.forEach(function(item, index){
		let uids = item.chain.split(' ');
		for (let i = 0; i < uids.length; i++) {
			let curr = {
				"id": uids[i],
				"depth": i
			}
			if (i == 0) {
				if (origin.indexOf(uids[i]) == -1) {
					curr['parent'] = null;
					new_data.push({source: curr});
					origin.push(uids[i])
				}
				continue;
			}
			let prev = {
				"id": uids[i-1],
				"depth": i-1,
			}
			curr['parent'] = uids[i-1];
			let link = {
				"_lid": uids[i-1] + "_" + uids[i],
				"source": uids[i-1],
				"target": uids[i]
			}
			new_data.push({
				"source": prev,
				"target": curr,
				"link": link
			})
		}
	});
	console.log(JSON.stringify(new_data));
}

/**
 * 添加一个随机 id 的node
 */
function add_random_node(node){
	let id;
	while (true) {
		id = Math.round(Math.random() * 1000) + "";
		if (GD_uids.indexOf(id) == -1) {
			GD_uids.push(id);
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
		"_lid": node.id + '_' + id,
		"source": node.id,
		"target": id
	}
	add_link(link);
	restart();
}

function main() {
	d3.request("../data/link.json")
		.mimeType("application/json")
		.response(function(xhr) {
			let data = JSON.parse(xhr.responseText);
			// format(data.data);
			// process_v1(data);
			process_v2(data);
		})
		.get()
	;
}

/**
 * 动态添加节点
 */
function process_v1(data) {
	let per = 1000;
	let count = data.length;
	// let count = 2;
	let index = 0;
	let timer = setInterval(function(){
		let s = data[index]['source'];
		if (s['id'] != 'null' && GD_uids.indexOf(s.id) == -1) {
			add_node(s);
		}
		let t = data[index]['target'];
		if (t && GD_uids.indexOf(t.id) == -1) {
			add_node(t);
		}
		let link = data[index]['link'];
		index++;
		add_link(link);
		restart();
	}, per);

	setTimeout(function(){
		clearInterval(timer);
	}, per*count);
}

/**
 * 一次渲染全部
 */
function process_v2(data) {
	let per = 1000;
	let count = data.length;
	let index = 0;
	for (var i = 0; i < count; i++) {
		let s = data[index]['source'];
		if (s['id'] != 'null' && GD_uids.indexOf(s.id) == -1) {
			add_node(s);
		}
		let t = data[index]['target'];
		if (t && GD_uids.indexOf(t.id) == -1) {
			add_node(t);
		}
		let link = data[index]['link'];
		index++;
		add_link(link);
	}
	restart();
}


function find_ancestors(d){
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
	G_node.classed('hide', function(d){
		if (result.indexOf(d.id) == -1) {
			return true;
		}
	});
	G_link.classed('hide', function(l){
		st = l._lid.split('_')
		if (result.indexOf(st[0]) == -1 || result.indexOf(st[1]) == -1) {
			return true;
		}
	})
}


function clear_hilight(){
	G_node.classed('hide', false);
	G_link.classed('hide', false);
}

/**
 * 添加一个节点
 * 如果没有父节点，则初始位置为svg中心，否则是父节点位置
 */
function add_node(node){
	GD_uids.push(node.id);
	let parent;
	if (node.parent) {
		parent = GD_nodes[GD_uids.indexOf(node.parent)];
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
 *
 * 闭环问题
 */
function add_link(link){
	// if (GD_link_id.indexOf(link._lid) > -1) {
	// 	return;
	// }
	if (link._lid.indexOf('null') > -1) {
		GD_link_depth[link.target] = 0;
		return;
	}
	if (!GD_link_depth[link.target]) {
		GD_link_depth[link.target] = GD_link_depth[link.source] + 1;
	}
	GD_link_id.push(link._lid);
	GD_links.push(link);
	let parent = GD_nodes[GD_uids.indexOf(link.source)];
	let child = link.target;
	if (parent && parent.children.indexOf(child) == -1) {
		parent.children.push(child);
	}
}