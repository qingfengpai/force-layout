
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

function process(data) {
	let per = 1000;
	let count = data.length;
	// let count = 2;
	let index = 0;
	let timer = setInterval(function(){
		let s = data[index]['source'];
		if (s && GD_uids.indexOf(s.id) == -1) {
			add_node(s);
		}
		let t = data[index]['target'];
		if (t && GD_uids.indexOf(t.id) == -1) {
			add_node(t);
		}
		let link = data[index]['link'];
		index++;
		if (link) {
			// 这条连接不存在
			if (GD_link_id.indexOf(link._lid) == -1) {
				add_link(link);
				restart();
			}
		} else { // 没有连接, 是根节点.
			restart();
		}
	}, per);

	setTimeout(function(){
		clearInterval(timer);
	}, per*count);
}

function main() {
	d3.request("../data/temp.json")
		.mimeType("application/json")
		.response(function(xhr) {
			let data = JSON.parse(xhr.responseText);
			// format(data.data);
			process(data);
		})
		.get()
	;
}


/**
 * 添加一个节点
 * 初始位置是 svg 中心
 */
function add_node(node){
	GD_uids.push(node.id);
	let parent = GD_nodes[GD_uids.indexOf(node.parent)];
	if (parent) {
		node.x = parent.x;
		node.y = parent.y;
	} else {
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
	GD_link_id.push(link._lid);
	GD_links.push(link);
	let parent = GD_nodes[GD_uids.indexOf(link.source)];
	let child = link.target;
	if (parent && parent.children.indexOf(child) == -1) {
		parent.children.push(child);
	}
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