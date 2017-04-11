

/**
 * 入口函数, 请求数据
 */
function main() {
	d3.request("../data/link-85f0c2.json")
		.mimeType("application/json")
		.response(function(xhr) {
			GD_data = xhr.responseText;
			G_dispatch.call("response_callbak", this, GD_data)
		})
		.get()
	;
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


/**
 * 不同场景对节点绑定不同类型的事件
 */
function new_node_created(nodes) {
	nodes.on("mouseover", hilight_spread_path)
		 .on("mouseout", clear_hilight)
		 .on("click", null)
}


/**
 * 高亮传播路径
 */
function hilight_spread_path(d){
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
