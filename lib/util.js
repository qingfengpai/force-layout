
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


// var E_time_clock = document.getElementById("time-clock");
// var E_use_time = document.getElementById("use-time");
// /**
//  * 开始计时
//  */
// function update_clock() {
// 	var begin = GD_data[0]['link']['time'];
// 	var end = GD_data[G_time.index]['link']['time']
// 	E_time_clock.innerText = (new Date(end*1000)).toLocaleString();
// 	E_use_time.innerText = compute_use_time(begin, end);
// }

// function compute_use_time(begin, end){
// 	var seconds = end - begin;
// 	var h = Math.floor(seconds/3600);
// 	var m = Math.floor((seconds - h*3600)/60);
// 	var s = seconds - (h*60+m)*60;
// 	return  h + ":" + m + ":" + s;
// }

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
			if (GD_nodes[i]['uid'] == value) {
				var elem = document.getElementById('id-' + GD_nodes[i]['id']);
				execute_mouseover(elem);
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
 * 操作按钮
 */
var E_operation = document.getElementById('operation');
E_operation.onclick = change_status;
function change_status(){
	for (var i = E_operation.childElementCount; i > 0; i--) {
		E_operation.children[i-1].classList.remove('curr');
	}
	var elem = event.target;
	if (GD_status != elem.id) {
		elem.classList.add('curr')
		GD_status = elem.id;
	}
	else {
		GD_status = "";
	}
}


/**
 * 暂停按钮
 */
var E_play_btn = document.getElementById("play");
E_play_btn.onclick = toggle_timer;
function toggle_timer(){
	var status = E_play_btn.dataset.status;
	// 点击开始展示
	if (status == "stop") {
		E_play_btn.classList.add("hide");
		E_play_btn.dataset.status = "start";
		dynamic_ordered();
	}
	// 点击显示暂停
	else {
		E_play_btn.classList.remove("hide");
		clearInterval(G_time.loop);
		clearInterval(G_time.clock);
		E_play_btn.dataset.status = "stop";
	}
}

/**
 * 执行鼠标悬浮事件
 */
function execute_mouseover(elem){
	switch (GD_status) {
		case "path":
			hilight_spread_path(elem);
			break;
		case "info":
			update_curr_node_info(elem);
			popup();
			break;
		case "predict":
			predict_retweet(elem);
			break;
	}
}

/**
 * 执行鼠标离开事件
 */
function execute_mouseleave(){
	if (GD_status == "path") {
		clear_hilight();
	}
}

/**
 * 弹出框
 */
var E_close_btn = document.getElementById('close-popup');
var E_modal = document.getElementById('modal');
E_close_btn.onclick = popdown;
function popdown(){
	E_modal.classList.remove('popup');
}
function popup(){
	E_modal.classList.add('popup');
}

/**
 * 更新当前节点信息
 */
var E_uid = document.getElementById("uid");
var E_wbid = document.getElementById("wbid");
var E_name = document.getElementById("uname");
var E_sex = document.getElementById("usex");
var E_fans = document.getElementById("fans");
var E_follow = document.getElementById("follow");
var E_pro = document.getElementById("upro");
var E_uv = document.getElementById("uv");
var E_depth = document.getElementById("udepth");
var E_avatar = document.getElementById("avatar");
function update_curr_node_info(elem) {
	var uid = elem.getAttribute('uid');
	var d = get_info_by_uid(uid);
	if (d.sex == "m") {
		E_sex.innerText = "男";
	} else if (d.sex == "f") {
		E_sex.innerText = "女";
	} else {
		E_sex.innerText = "未知";
	}
	if (d.v == 1) {
		E_uv.innerText = "是";
	} else {
		E_uv.innerText = "不是";
	}
	E_avatar.setAttribute('src', d.avatar.replace('.180/', '.280/'));
	E_uid.innerText = d.uid;
	E_wbid.innerText = elem.getAttribute('id').replace('id-', '');
	E_name.innerText = d.name;
	E_fans.innerText = d.followers;
	E_follow.innerText = d.friends;
	E_pro.innerText = d.location;
	E_depth.innerText = parseInt(elem.getAttribute('depth')) + 1;
}

/**
 * 根据用户 id 获取用户信息
 */
function get_info_by_uid(uid){
	return GD_total_users[uid];
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
	    	GD_province = JSON.parse(xhr.responseText);
	   	}).get()
	;
	// user 数据
	d3.request("../data/abe47d/users-abe47d.json").mimeType("application/json")
		.response(function(xhr) {
			GD_total_users = JSON.parse(xhr.responseText);
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

	var begin = root_node['time'];
	GD_prov['total'] = GD_data.length;
}

/**
 * 按时间添加节点
 * 实际时间差小于设定的 gap
 */
function dynamic_ordered(){
	G_time.loop = setInterval(function(){
		var added = false;
		var item;
		while (true) {
			item = GD_data[G_time.index];
			if (item == undefined) {
				clearInterval(G_time.loop);
				break;
			}
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
 * 转发预测
 */
var E_loading = document.getElementById('loading');
function predict_retweet(elem){
	E_loading.classList.remove("hide");
	setTimeout(function(){
		for (var i = 0; i < 5; i++) {
			add_random_node(elem);
		}
		E_loading.classList.add("hide");
	}, 5000);
}

/**
 * 添加一个随机 id 的node
 * parent_node 是传入的参数父节点
 */
function add_random_node(parent_node){
	var random;
	while (true) {
		random = Math.round(Math.random() * GD_nodes.length);
		if (GD_wbids.indexOf(random + "") == -1) {
			break;
		}
	}
	var i = 0;
	var uid;
	for (item in GD_total_users) {
		if (i == random) {
			uid = item;
			break;
		}
		i++
	}
	var ancestors = parent_node.dataset.ancestors.split('-');
	var depth = ancestors.length;
	var new_node = {
		"time": new Date(),
		"parent": ancestors[depth-1],
		"depth": depth,
		"id": random + "",
		"uid": uid
	}
	add_node(new_node);
	add_link(new_node);
	restart();
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
