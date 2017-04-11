
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

function predict(data) {
	path(data);
}

/**
 * 不同场景对节点绑定不同类型的事件
 */
function new_node_created(nodes) {
	nodes
		 // .on("mouseover", null)
		 .on("mouseout", null)
		 .on("mouseover", predict_retweet)
}

function predict_retweet(d){
	console.log(d);
	for (let i = 0; i < 10; i++) {
		add_random_node(d);
	}
}

/**
 * 添加一个随机 id 的node
 */
function add_random_node(node){
	let id;
	while (true) {
		id = Math.round(Math.random() * 1000) + "";
		if (GD_wbids.indexOf(id) == -1) {
			break;
		}
	}
	console.log(node);
	let new_node = {
		"id": id,
		"depth": node.depth + 1,
		"parent": node.id
	}
	add_node(new_node);
	let link = {
		"id": node.id + '-' + id,
		"type": "predict",
		"source": node.id,
		"target": id
	}
	add_link(link);
	restart();
}
