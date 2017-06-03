
function init_chart() {
	// set the dimensions and margins of the graph
	var margin = {top: 20, right: 20, bottom: 30, left: 50},
		width = 800 - margin.left - margin.right,
		height = 400 - margin.top - margin.bottom;

	G_line_chart = d3.select("#line-chart-item")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
}

function update_line_item(data) {
	var parseTime = d3.timeFormat("%B %d, %Y");
	var valueline = d3.line()
		.x(function(d) { return x(d.date); })
		.y(function(d) { return y(d.close); });

	var margin = {top: 20, right: 20, bottom: 30, left: 50},
		width = 800 - margin.left - margin.right,
		height = 400 - margin.top - margin.bottom;

	var x = d3.scaleTime().range([0, width]);
	var y = d3.scaleLinear().range([height, 0]);

	var data = [];
	GD_time_data['days'].forEach(function(item, index) {
		data.push(GD_time_data[item])
	})

	// format the data
	data.forEach(function(d) {
		d.date = parseTime(d.date);
		d.close = +d.close;
	});

	// Scale the range of the data
	x.domain(d3.extent(data, function(d) { return d.date; }));
	y.domain([0, d3.max(data, function(d) { return d.close; })]);

	// Add the valueline path.
	G_line_chart.append("path")
		.data([data])
		.attr("class", "chart-line")
		.attr("d", valueline);

	// Add the X Axis
	G_line_chart.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x));

	// Add the Y Axis
	G_line_chart.append("g")
		.call(d3.axisLeft(y));
}

/**
 * 生成中国地图
 */
function chainmap(root) {
	var color = d3.scaleOrdinal(d3.schemeCategory20);

	var svg = d3.select("#map").append("g");
	var width = +svg.attr("width");
	var height = +svg.attr("height");
	var projection = d3.geoMercator()
			.center([200, 0])
			.scale(200);
	var path = d3.geoPath()
			.projection(projection);

	svg.selectAll("path")
			.data(root.features)
			.enter()
			.append("path")
			.attr("d", path)
			.attr("fill", function (d, i) {
				return "#aec7e8";
			})
			// .on("mouseover", function (d, i) {
			// 	console.log(d.properties);
			// 	console.log(GD_prov[d.properties.id])
			// })
			// .on("mouseout", function (d, i) {

			// });
}


var E_time_clock = document.getElementById("time-clock");
var E_use_time = document.getElementById("use-time");
/**
 * 开始计时
 */
function update_clock() {
	var begin = GD_data[0]['link']['time'];
	var end = GD_data[G_time.index]['link']['time']
	E_time_clock.innerText = (new Date(end*1000)).toLocaleString();
	E_use_time.innerText = compute_use_time(begin, end);
}

function compute_use_time(begin, end){
	var seconds = end - begin;
	var h = Math.floor(seconds/3600);
	var m = Math.floor((seconds - h*3600)/60);
	var s = seconds - (h*60+m)*60;
	return  h + ":" + m + ":" + s;
}

/**
 * 暂停按钮
 */
var E_stop_btn = document.getElementById("stop");
E_stop_btn.onclick = toggle_timer;
function toggle_timer(){
	E_stop_btn.classList.toggle("start");
	E_stop_btn.classList.toggle("stop");
	var status = E_stop_btn.dataset.status;
	if (status == "stop") {
		E_stop_btn.dataset.status = "start";
		// dynamic_process();
		dynamic_ordered();
	} else {
		clearInterval(G_time.loop);
		clearInterval(G_time.clock);
		E_stop_btn.dataset.status = "stop";
		// G_time.end = node.time;
	}
}

/**
 * 搜索框
 */
var E_search_btn = document.getElementById("search");
E_search_btn.onkeyup = input_and_search;
function input_and_search(){
	if (E_search_btn.dataset.status == "search") {
		E_search_btn.dataset.status = "false";
		clear_hilight();
	}
	if (event.keyCode == 13) {
		E_search_btn.dataset.status = "search";
		var value = E_search_btn.value;
		var searched = false;
		for (var i = GD_nodes.length - 1; i >= 0; i--) {
			if (GD_nodes[i]['uid'] == value ||
				GD_nodes[i]['id'] == value) {
				update_curr_node_info(GD_nodes[i]);
				hilight_spread_path(GD_nodes[i]);
				searched = true;
				break;
			}
		}
		if (!searched) {
			alert("不存在的用户id");
		}
	}
}


/**
 * 初始化，请求数据
 */
function initialize(){
	// 地图数据
	d3.request("../data/chain-geo.json").mimeType("application/json")
		.response(function(xhr) {
			chainmap(JSON.parse(xhr.responseText));
		}).get()
	;
	// 省份数据
	d3.request("../data/province.json").mimeType("application/json")
	    .response(function(xhr) {
	    	GD_province = JSON.parse(xhr.responseText)
	   	}).get()
	;
	// d3.request("../data/link-85f0c2.json")	// little 47
	// d3.request("../data/link-230127.json")	// middle 2282
	// d3.request("../data/link-b76cde.json") 	// big 29455
	// link 数据
	d3.request("../data/abe47d/links-abe47d.json").mimeType("application/json")
		.response(function(xhr) {
			GD_data = JSON.parse(xhr.responseText);
			init_root();
		}).get()
	;
	// user 数据
	d3.request("../data/abe47d/links-abe47d.json").mimeType("application/json")
		.response(function(xhr) {
			GD_total_users = JSON.parse(xhr.responseText);
		}).get()
	;
}

/**
 * 初始化根节点
 */
function init_root() {
	var root_node = GD_data[G_time.index];
	add_node(root_node);
	add_link(root_node);
	G_time.index++;
	G_time.begin = root_node.time;
	G_time.end = root_node.time;
	restart();

	// update_curr_node_info(root_node);

	var begin = root_node['time'];
	E_time_clock.innerText = (new Date(begin*1000)).toLocaleString();
	GD_prov['total'] = GD_data.length;
}

/**
 * 动态随机添加节点
 */
function dynamic_process(){
	G_time.loop = setInterval(function(){
		var count = Math.ceil(Math.random() * 10);
		if (GD_nodes.length == GD_data.length) {
			clearInterval(G_time.loop);
		}
		while (count > 0) {
			try {
				var item = GD_data[G_time.index];
				if (GD_wbids.indexOf(item['parent']) == -1) {
					add_node(item);
				}
				if (GD_wbids.indexOf(item['id']) == -1) {
					add_node(item);
				}
				add_link(item);
			} catch (e) {
				break;
			} finally {
				G_time.index++;
				count--;
			}
		}
		restart();
		// update_clock();
	}, G_time.unit);
}

/**
 * 按时间添加节点
 * 实际时间差小于设定的 gap
 */
function dynamic_ordered(){
	G_time.loop = setInterval(function(){
		if (GD_nodes.length == GD_data.length) {
			clearInterval(G_time.loop);
		}
		var added = false;
		while (true) {
			var item = GD_data[G_time.index];
			var gap = item['time'] - G_time.end;
			if (gap > G_time.gap) {
				G_time.end = item['time'];
				break;
			}
			if (GD_wbids.indexOf(item['parent']) == -1) {
				add_node(item);
			}
			if (GD_wbids.indexOf(item['id']) == -1) {
				add_node(item);
			}
			add_link(item);
			G_time.index++;
			added = true;
		}
		if (added) {
			restart();
			// update_clock();
		}
	}, G_time.unit);
}


/**
 * 更新当前节点信息
 */
var E_uid = document.getElementById("uid");
var E_sex = document.getElementById("usex");
var E_pro = document.getElementById("upro");
var E_uv = document.getElementById("uv");
var E_depth = document.getElementById("udepth");
function update_curr_node_info(d) {
	if (!d) { return; }
	G_curr.node = d;
	var sex;
	if (d.sex == "m") { sex = "男" } else if (d.sex == "f") { sex = "女" } else { sex = "未知"}
	var uv;
	if (d.v == 1) { uv = "是"} else { uv = "不是"; }
	E_uid.innerText = d.index;
	E_sex.innerText = sex;
	E_pro.innerText = GD_province[d.province].name;
	E_uv.innerText = uv;
	E_depth.innerText = d.depth;
}

/**
 * 更新左侧节点数据
 */
var E_node_num = document.getElementById("node-num");
var E_user_num = document.getElementById("user-num");
function update_left_num(){
	E_node_num.innerText = GD_wbids.length;
	E_user_num.innerText = GD_users.length;
}


function show_node_info(d){
	console.log(d);
}


var E_predict_btn = document.getElementById("predict");
E_predict_btn.onclick = predict_retweet;

/**
 * 转发预测
 */
function predict_retweet(){
	var d = G_curr.node;
	for (var i = 0; i < 5; i++) {
		add_random_node(d);
	}
}

/**
 * 高亮传播路径, 每个node上都存储着祖先元素
 */
function hilight_spread_path(d){
	var result = d.ancestors.split('-');
	result.unshift();
	result.push(d.id);
	G_nodes.classed('hide', function(d){
		if (result.indexOf(d.id) == -1) {
			return true;
		}
	});
	G_links.classed('hide', function(l){
		if (result.indexOf(l.target.id) == -1) {
			return true;
		}
	});
}

/**
 * 清除高亮
 */
function clear_hilight(){
	G_nodes.classed('hide', false);
	G_links.classed('hide', false);
}

/**
 * 添加一个随机 id 的node
 * parent_node 是传入的参数父节点
 */
function add_random_node(parent_node){
	var random;
	while (true) {
		random = Math.round(Math.random() * GD_nodes.length) + "";
		if (GD_wbids.indexOf(random) == -1) {
			break;
		}
	}
	var new_node = {
		"time": new Date(),
		"parent": parent_node.id,
		"id": random,
		"uid": GD_users[random]
	}
	add_node(new_node);
	add_link(new_node);
	restart();
}
