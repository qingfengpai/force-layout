// abe47d => 360
var url_key = "abe47d";

// // 7a317e => 116909
// var url_key = "7a317e";

/**
 * 初始化，请求数据
 */
function initialize(){
	// // 地图数据
	// d3.request("../data/chain-geo.json").mimeType("application/json")
	// 	.response(function(xhr) {
	// 		chainmap(JSON.parse(xhr.responseText));
	// 	}).get()
	// ;
	// // 省份数据
	// d3.request("../data/province.json").mimeType("application/json")
	// 	.response(function(xhr) {
	// 		GD_province = JSON.parse(xhr.responseText);
	// 	}).get()
	// ;
	// user 数据
	d3.request("../data/" + url_key + "/users-" + url_key + ".json")
		.mimeType("application/json")
		.response(function(xhr) {
			GD_total_users = JSON.parse(xhr.responseText);
			// popup();
		}).get()
	;
	// link 数据
	d3.request("../data/" + url_key + "/links-" + url_key + ".json")
		.mimeType("application/json")
		.response(function(xhr) {
			GD_data = JSON.parse(xhr.responseText);
			init_root();
			init_chart();
		}).get()
	;
}


function init_chart() {
	var margin = {top: 10, right: 10, bottom: 30, left: 50};
	var width = w - 50 - margin.left - margin.right;
	var height = 210 - margin.top - margin.bottom;
	G_chart.width = width;
	G_chart.height = height;

	G_x_scale = d3.scaleTime().range([0, width]);

	G_y_scale = d3.scaleLinear().range([height, 0]);

	G_line_chart = d3.select("#line-chart-item")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		;

	G_line_chart.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(G_x_scale)
			.tickFormat(d3.timeFormat("%I:%M"))
			// .tickFormat(d3.timeFormat("%Y-%m-%d"))
		)
		;

	G_line_chart.append("g")
		.attr("class", "y axis")
		.call(d3.axisLeft(G_y_scale))
		;

	G_line_chart.append("path").attr("id", "data-line");

	//
	G_line = d3.line()
		.x(function(d, i) { return G_x_scale(d.x); })
		.y(function(d) { return G_y_scale(d.y); })
		.curve(d3.curveMonotoneX)
		;
}


function update_chart_curve() {
	var begin = new Date(G_time.begin * 1000 );
	var end = new Date(G_time.end * 1000);

	G_x_scale = d3.scaleTime()
		.domain([begin, end])
		.range([0, G_chart.width])
		;

	G_y_scale = d3.scaleLinear()
		.domain([0, G_chart.max])
		.range([G_chart.height, 0])
		;

	// update data-line
	G_line_chart.select("#data-line")
		.data(GD_chart)
		.attr("class", "line")
		.attr("d", G_line(GD_chart));

	// G_line_chart.selectAll(".dot")
	// 	.data(GD_chart)
	// 	.enter().append("circle")
	// 	.attr("class", "dot")
	// 	.attr("cx", function(d, i) { return G_x_scale(d.x) })
	// 	.attr("cy", function(d) { return G_y_scale(d.y) })
	// 	.attr("r", 5);

	// update x axis
	G_line_chart.select(".x").call(d3.axisBottom(G_x_scale));

	// update y axis
	G_line_chart.select(".y").call(d3.axisLeft(G_y_scale));
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
	G_curr.nodeid = root_node.id;
}

/*
 * 更新线性表需要的数据
 */
function update_chart_data(count){
	if (count > G_chart.max) {
		G_chart.max = count;
	}
	GD_chart.push(
		{
			'x': new Date(G_time.end * 1000),
			'y': count
		}
	);
}

/**
 * 按时间添加节点
 * 实际时间差小于设定的 gap
 */
function dynamic_ordered(){
	G_time.loop = setInterval(function(){
		var added = false;
		var xydata = [];
		// 一个基本单元时间内增加的转发节点数
		var count = 0;
		// 计时器 增加一个基本单元时间
		G_time.end += G_time.gap;
		while (true) {
			var item = GD_data[G_time.index];
			// 没有更多节点
			if (item == undefined) {
				clearInterval(G_time.loop);
				update_chart_data(count);
				break;
			}
			// 当前节点不在一个基本单元时间内
			if (item['time'] > G_time.end) {
				update_chart_data(count);
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
			count++;
			added = true;
		}
		// 如果有增加节点, 就重启力导引布局
		if (added) {
			restart();
		}
		// if (layer_status.curve) {
		// 	// 更新转发时间线性表的数据
			update_chart_curve();
		// }
	}, G_time.unit);
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