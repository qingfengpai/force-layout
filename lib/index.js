/**
 * 初始化
 */
function initialize() {
	create_arrow();
}

/**
 * 缩放
 */
function zoomed() {
	// var type = d3.event.sourceEvent.type;
	console.log(d3.event);
	// if (type == "mousemove") {return;}
	g.attr("transform", d3.event.transform);
}

/**
 * 节点配色
 */
function get_color(d) {
	var color = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
	return color[d.depth];
}

// 创建箭头
function create_arrow() {
	var defs = svg.append("defs");
	var arrow_path = "M2,2 L10,6 L2,10 L6,6 L2,2";
	var arrowMarker = defs.append("marker")
		.attr("id","arrow")
		.attr("markerUnits","strokeWidth")
		.attr("markerWidth","6")
		.attr("markerHeight","12")
		.attr("viewBox","0 0 12 12")
		.attr("refX","18")
		.attr("refY","6")
		.attr("orient","auto");
	arrowMarker.append("path")
		.attr("d",arrow_path)
		.attr("fill","#333");
}

// 拖动事件
function dragged() {
	d3.event.subject.x = d3.event.x;
	d3.event.subject.y = d3.event.y;
}

function ticked() {
	// node.attr("transform", function(d) {
	// 	return "translate(" + d.x + "," + d.y + ")";
	// });

	node.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });

	link.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });
}

function click(node) {
	console.log(node)
}

function main() {
	var a = {id: "a", depth: 0},
		b = {id: "b", depth: 1},
		c = {id: "c", depth: 1},
		d = {id: "d", depth: 2},
		e = {id: "e", depth: 2},
		f = {id: "f", depth: 2};

	nodes.push(a)
	restart();

	d3.timeout(function() {
		nodes.push(b);
		links.push({source: a, target: b});
		restart();
	}, 1000);

	d3.timeout(function() {
		nodes.push(c);
		links.push({source: a, target: c});
		restart();
	}, 2000);

	d3.timeout(function() {
		nodes.push(d);
		links.push({source: b, target: d});
		restart();
	}, 3000);

	d3.timeout(function() {
		nodes.push(e);
		nodes.push(f);
		links.push({source: b, target: e});
		links.push({source: c, target: f});
		restart();
	}, 4000);
}

/**
 * 力导引布局
 */
function restart() {
	// Apply the general update pattern to the nodes.
	node = node.data(nodes, function(d) { return d.id;});

	node.exit().transition()
		.attr("r", 0)
		.remove();

	node = node.enter().append("circle")
		.attr("fill", function(d) { return get_color(d); })
		.attr("data-d", function(d) { return d.id; })
		// .attr("cx", function(d) { console.log(d); return d.x; })
		// .attr("cy", function(d) { console.log(d); return d.y; })
		.attr("r", 8)
		.on("click", click)
		.call(d3.drag().on("drag", dragged))
		.merge(node);

	// Apply the general update pattern to the links.
	link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });

	// Keep the exiting links connected to the moving remaining nodes.
	link.exit().transition()
		.attr("stroke-opacity", 0)
		.attrTween("x1", function(d) { return function() { return d.source.x; }; })
		.attrTween("x2", function(d) { return function() { return d.target.x; }; })
		.attrTween("y1", function(d) { return function() { return d.source.y; }; })
		.attrTween("y2", function(d) { return function() { return d.target.y; }; })
		.remove();

	link = link.enter().append("line")
		.attr("stroke", "#333")
		.attr("stroke-width", 2)
		.attr("marker-end","url(#arrow)") // 添加箭头
		.call(function(link) {
			link.transition().attr("stroke-opacity", 1);
		})
		.merge(link);

	// Update and restart the simulation.
	simulation.nodes(nodes);
	simulation.force("link").links(links);
	simulation.alpha(1).restart();
}