////////////////////////////////////////////////////////////////
//// 测试 begin
////////////////////////////////////////////////////////////////
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
	let index = 0;
	let timer = setInterval(function(){
		let s = data[index]['source'];
		if (s && GD_uids.indexOf(s.id) == -1) {
			GD_uids.push(s.id);
			s.x = w/2;
			s.y = h/2;
			GD_nodes.push(s);
		}
		let t = data[index]['target'];
		if (t && GD_uids.indexOf(t.id) == -1) {
			GD_uids.push(t.id);
			t.x = w/2;
			t.y = h/2;
			GD_nodes.push(t);
		}
		let link = data[index]['link'];
		if (link) {
			GD_links.push(link);
		}
		index++
		restart();
	}, per);

	setTimeout(function(){
		clearInterval(timer);
	}, per*count);
}

function main() {
	d3.request("../data/new.json")
		.mimeType("application/json")
		.response(function(xhr) {
			let data = JSON.parse(xhr.responseText);
			// format(data.data);
			process(data);
		})
		.get()
	;
}
////////////////////////////////////////////////////////////////
//// 测试 begin
////////////////////////////////////////////////////////////////


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

function ticked(d) {
	G_link
		.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });

	G_node.attr("transform", function(d) {
		return "translate(" + d.x + "," + d.y + ")";
	});

	// G_node
	// 	.attr("cx", function(d) { return d.x; })
	// 	.attr("cy", function(d) { return d.y; });
}

/**
 * 节点点击
 */
function node_click(node) {
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
	GD_nodes.push(new_node);
	GD_links.push({
		"source": node.id,
		"target": id
	});
	restart()
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
		.on("mouseover", node_click)
		// .call( d3.drag().on("drag", dragged) )
		.merge(G_node);

	// 更新所有节点
	G_node.attr("r", get_node_size)

	// Apply the general update pattern to the links.
	G_link = G_link.data(GD_links,  function(d) {
					return d.source.id + "-" + d.target.id;});

	// Keep the exiting links connected to the moving remaining nodes.
	G_link.exit().remove();

	// new add line
	G_link = G_link.enter().append("line")
		.attr("class", "line")
		.merge(G_link);

	// G_node = G_node.data(GD_nodes);
	// var node_enter = G_node.enter().append("circle")
	// 	.attr("fill", function(d) { return get_color(d); })
	// 	.attr("class", function(d) { if (!d.index) { return "show"; } })
	// 	.attr("r", get_node_size)
	// 	.on("click", node_click)
	// G_node = node_enter.merge(G_node);

	// G_link = G_link.data(GD_links);
	// var link_enter = G_link.enter().append("line")
	// 	.attr("class", "line")
	// G_link = link_enter.merge(G_link);

	G_simulation.stop();

	// Update and restart the simulation.
	G_simulation.nodes(GD_nodes);
	G_simulation.force("link").links(GD_links);
	G_simulation.alpha(1)
	G_simulation.restart();
}