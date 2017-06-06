
// 容器可缩放, link存线, node存节点
var G_svg = d3.select("#retweet");
var G_g = d3.select("#container");
var G_links = d3.select("#line-container").selectAll(".link");
var G_nodes = d3.select("#node-container").selectAll(".node");

// 后端数据
var GD_data;
var GD_nodes = [];
var GD_links = [];
// 每个微博是一个节点, 它的索引和 GD_nodes 相对应
var GD_wbids = [];
// 根据节点 id 查找节点信息
var GDObject = {};

var GD_status = "stop";
var G_simulation;

var GD_users = [];
var GD_total_users;

var GD_prov = {"total": 0};		// 地图深度数据
var GD_time_data = {
	"days": []
};

var G_curr = {
	"node": "",
	"real_r": ""
}

// 布局停止在真实的哪个时间点
// 多久循环一次, 单位ms, 毫秒
// 真实时间间隔: 单位s, 秒
// 第几个节点
var G_time = {
	'end': 0,
	'unit': 1000,
	'gap': 60,
	'index': 0
}

var G_line_chart;
var G_map_path = d3.select("#map").selectAll("path");


/**
 * 禁用右键菜单
 */
G_svg.attr('oncontextmenu', 'return false;')
	.call(d3.zoom()
		.scaleExtent([1/1000, 10])
		.on("zoom", zoomed)
	)
	// .on("click", function(){
	// 	console.log("click");
	// })
	// .on("dblclick.zoom", function(){
	// 	console.log("dblclick");
	// })
	;


/**
 * 创建并配置力导引模拟器
 *
 * 获得svg的大小, 以便设置布局居中
 *
 * collide: 设置碰撞作用力, 防止节点重叠.
 */
var w = +G_svg.attr("width");
var h = +G_svg.attr("height");
G_simulation = d3.forceSimulation()
	.velocityDecay(0.55)
	.force("link", d3.forceLink()
		.id(d => d.id)
		.distance(distance)
		.strength(function(link) {
			//
			return 0.7;
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

/**
 * 设置node可拖动, mouseover mouseleave事件
 */
d3.select("#node-container")
	.call(d3.drag()
		.subject(dragsubject)
		.on("start", dragstarted)
		.on("drag", dragged)
		.on("end", dragended)
	)
	.on('mouseover', function(){
		var elem = event.target;
		// G_curr.node = elem;
		// hilight_node(elem);
		execute_mouseover(elem);
	})
	.on('mouseleave', function(){
		// dishilight_node();
		execute_mouseleave();
	})
	;

function hilight_node(elem){
	d3.select(elem)
		.classed('hover', true)
		;
}
function dishilight_node(){
	var elem = G_curr.node;
	d3.select(elem)
		.classed('hover', false)
		;
}

/**
 * 点击空格时, 触发动画
 */
document.body.onkeyup = function(){
	var code = event.keyCode;
	if (code == 32) {
		toggle_timer();
	}
}


initialize()
