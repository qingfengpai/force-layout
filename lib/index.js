
function main() {
	function process(data) {
		let node_list = [];
		let nodes_data = [];
		let links_data = [];
		data.forEach(function(item, index){
			let arr = item.chain.split(' ');
			arr.forEach(function(u, i){
				// 节点处理
				if (node_list.indexOf(u) == -1) {
					node_list.push(u);
					let node = {
						"name": u,
						"depth": i,
						"children": []
					}
					nodes_data.push(node);
				}
				// 处理根元素
				if (i == 0) return;
				let source = nodes_data[node_list.indexOf(arr[i-1])];
				let target = nodes_data[node_list.indexOf(u)];
				let link = {
					"source": source,
					"target": target
				};
				links_data.push(link);

				if (source.children.indexOf(target) == -1) {
					source.children.push(target);
				}
			});
		});
		GD_nodes = nodes_data;
		GD_links = links_data;
		restart();
	}

	function after_format(data1){
		let data = format(data1);
		let len = data.length;
		let node_id_list = [];
		let nodes_data = [];
		let links_data = [];
		for (let i = 0; i < len; i++) {
			let item = data[i];
			console.log(i, item);
			let source = item.sid;
			let target = item.tid;
			if (node_id_list.indexOf(source.id) == -1) {
				node_id_list.push(source.id);
				nodes_data.push(source);
			}
			if (node_id_list.indexOf(target.id) == -1) {
				node_id_list.push(target.id);
				nodes_data.push(target);
			}
			let link = {
				"source": source.id,
				"target": target.id,
				"value": 1
			};
			links_data.push(link);
		}
	}

	/**
	 * 格式化
	 * @param  {"time": "2012-07-09-00:59:06", "chain": "872570 1541505"}
	 * @return <array> [{sourceid, targetid}]      [description]
	 */
	function format(data){
		let result = []
		data.forEach(function(item, index){
			let arr = item.chain.split(' ');
			arr.forEach(function(u, i){
				if (i == 0) { return }
				let chain = {
					"sid": {
						"id": arr[i-1],
						"depth": i-1
					},
					"tid": {
						"id": arr[i],
						"depth": i
					}
				}
				result.push(chain);
			});
		});
		return result;
	}

	function test(data) {
		var time_index = 0;

		let timer = setInterval(function(){
			var nodes_data = [];
			var links_data = [];
			var node_id_list = [];

			for (let i = 0; i < data.length; i++) {
				if (time_index < i) { break; }
				let link = data[i]
				if (node_id_list.indexOf(link.source) == -1) {
					node_id_list.push(link.source);
					nodes_data.push({
						id: link.source,
						depth: link.value
					})
				}
				if (link.target && node_id_list.indexOf(link.target) == -1) {
					node_id_list.push(link.target);
					nodes_data.push({
						id: link.target,
						depth: link.value + 1
					})
				}
				if (!link.target) { continue; }
				var s = nodes_data[node_id_list.indexOf(link.source)];
				var t = nodes_data[node_id_list.indexOf(link.target)];
				links_data.push({
					source: s,
					target: t
				})
			}
			time_index++
			GD_nodes = nodes_data;
			GD_links = links_data;
			// console.log(nodes_data, links_data);
			restart();
		}, 2000);

		setTimeout(function(){
			clearInterval(timer);
		}, 36000);

	}

	d3.request("../data/format.json")
		.mimeType("application/json")
		.response(function(xhr) {
			let data = JSON.parse(xhr.responseText);
			test(data.links);
		})
		.get()
	;
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
	return 40;
	// let base = 40;
	// let begin = line.source.children.length;
	// let end = line.target.children.length;
	// let total = begin + end;
	// if (total < 3) {
	// 	return base;
	// }
	// return base + total*2;
}

/**
 * 缩放
 */
function zoomed() {
	// svg 直接子元素可缩放
	G_g.attr("transform", d3.event.transform);
}

/**
 * 节点配色
 */
function get_color(d) {
	var color = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
	return color[d.depth];
}

// 拖动事件
function dragged(d) {
	// d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
	d3.event.subject.x = d3.event.x;
	d3.event.subject.y = d3.event.y;
}

function ticked() {
	// node.attr("transform", function(d) {
	// 	return "translate(" + d.x + "," + d.y + ")";
	// });

	G_node.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });

	G_link.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });
}

/**
 * 节点点击
 */
function node_click(node) {
	console.log("click: ", node);
}


/**
 * 获得节点的半径
 */
function get_node_size(node) {
	return 8;
	// let base = 8
	// let l = node.children.length;
	// if (l < 2) {
	// 	return base
	// }
	// return base + 1.5*(l-2);
}

/**
 * 力导引布局
 */
function restart() {
	// Apply the general update pattern to the nodes.
	G_node = G_node.data(GD_nodes, function(d) { return d.id;});

	// 移除旧节点
	G_node.exit().remove();

	// 添加新节点
	G_node = G_node.enter().append("circle")
		.attr("fill", function(d) { return get_color(d); })
		.attr("class", function(d) { if (!d.index) { return "show"; } })
		.attr("r", get_node_size)
		.on("click", node_click)
		.call( d3.drag().on("drag", dragged) )
		.merge(G_node);

	// // 更新所有节点
	// G_node.attr("r", get_node_size)

	// Apply the general update pattern to the links.
	G_link = G_link.data(GD_links,  function(d) {
					return d.source.id + "-" + d.target.id;});

	// Keep the exiting links connected to the moving remaining nodes.
	G_link.exit().remove();

	// new add line
	G_link = G_link.enter().append("line")
		.attr("class", "line")
		.merge(G_link);

	G_simulation.stop();

	// Update and restart the simulation.
	G_simulation.nodes(GD_nodes);
	G_simulation.force("link").links(GD_links);
	G_simulation.alpha(1)
	G_simulation.restart();
}