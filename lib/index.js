var arr_color = ["#d62728", "#1f77b4", "#ff7f0e", "#2ca02c", "#9467bd", "#8c564b", "#e377c2",
				 "#ff9896", "#aec7e8", "#ffbb78", "#98df8a", "#c5b0d5", "#c49c94", "#f7b6d2"];

/**
 * 生成配色
 */
function color(depth) {
	var len = arr_color.length;
	if (depth > len) {
		return depth % len;
	}
	return arr_color[depth];
}

// 根容器
var G_svg = d3.select("#retweet")
	// .attr('oncontextmenu', 'return false;')
	.call(d3.zoom()
		.scaleExtent([1/1000, 8])	// 缩放比例
		.on("zoom", zoomed)		// 缩放事件
	)
	.on("click", function(){
		console.log("click");
	})
	.on("dblclick.zoom", function(){
		console.log("dblclick");
	})
	;

// 为了使得布局居中
var w = +G_svg.attr("width");
var h = +G_svg.attr("height");

/**
 * 深度越大的节点，离心力越大
 */
function many_body_strength(node) {
	var charge = (node.depth+1);
	return -2*charge;
}

// 创建并配置力导引模拟器
var G_simulation = d3.forceSimulation()
	.velocityDecay(0.55)
	.force("link", d3.forceLink()
		.id(d => d.id)
		.distance(distance)
		.strength(function(link) {
			return 0.7;
			// return 1/(link.source.childrenNum + link.target.childrenNum + 1)
		})
	)
	.force("charge", d3.forceManyBody()
		.strength(many_body_strength)
		.distanceMin(20)
		// .distanceMax(200)
	)
	.force("collide", d3.forceCollide(5))
	.force("center", d3.forceCenter(w/2, h/2))
	.alphaTarget(0)
	.on("tick", ticked)
	;

// 容器, link存线, node存节点
var G_g = G_svg.select("#container");
var G_links = G_g.select("#line-container").selectAll(".link");
var G_nodes = G_g.select("#node-container").selectAll(".node");

var G_line_chart;
var G_map_path = d3.select("#map").selectAll("path");


// 后端数据
var GD_data;
var GD_nodes = [];
var GD_links = [];
// 每个微博是一个节点, 它的索引和 GD_nodes 相对应
var GD_wbids = [];
// 根据节点 id 查找节点信息
var GDObject = {};

var GD_users = [];
var GD_total_users;

var GD_prov = {"total": 0};		// 地图深度数据
var GD_time_data = {
	"days": []
};

var G_time = {
	'end': 0,		// 布局停止在真实的哪个时间点
	'unit': 1000,	// 多久循环一次, 单位ms, 毫秒
	'gap': 60,		// 真实时间间隔: 单位s, 秒
	'index': 0
}

var GD_status = "stop";
var G_node_container = G_g.select('#node-container');
G_g.select('#node-container').on('mouseover', function(){
	var elem = event.target;
	execute_mouseover(elem)
});
G_g.select('#node-container').on('mouseleave', function(){
	execute_mouseleave();
});

document.body.onkeyup = function(){
	var code = event.keyCode;
	if (code == 32) {
		E_play_btn.click();
	}
}

initialize()
