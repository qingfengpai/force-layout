

/**
 * 入口函数, 请求数据
 */
function main() {
	// d3.request("../data/link-85f0c2.json")
	d3.request("../data/link-230127.json")
		.mimeType("application/json")
		.response(function(xhr) {
			GD_data = xhr.responseText;
			G_dispatch.call("response_callbak", this, GD_data)
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
		let count = Math.ceil(Math.random() * 10);
		console.log(count);
		while (count > 0) {
			try {
				let s = data[index]['source'];
				if (GD_wbids.indexOf(s.id) == -1) {
					add_node(s);
				}
				let t = data[index]['target'];
				if (GD_wbids.indexOf(t.id) == -1) {
					add_node(t);
				}
				add_link(data[index]['link']);
			} catch (e) {
				break;
			} finally {
				index++;
				count--;
			}
		}
		restart();
	}, per);

	setTimeout(function(){
		clearInterval(G_timer);
	}, per*count);
}

/**
 * 不同场景对节点绑定不同类型的事件
 */
function new_node_created(nodes) {
	nodes.on("mouseover", null)
		 .on("mouseout", null)
		 .on("click", show_node_info)
}

function show_node_info(d){
	console.log(d);
}