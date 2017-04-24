
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


function initialize(){
	// init_chart();
	d3.request("../data/chain-geo.json")
		.mimeType("application/json")
		.response(function(xhr) {
			var data = JSON.parse(xhr.responseText);
			chainmap(data);
		})
		.get();
	// d3.csv("../data/line-chart-data.csv", function(error, data) {
	// 	update_line_item(data);
	// 	setTimeout(update_line_item, 5000)
	// })
}

/**
 * 入口函数, 请求数据
 */
function main() {
	d3.request("../data/link-85f0c2.json")	// little 47
	// d3.request("../data/link-230127.json")	// middle 2282
	// d3.request("../data/link-b76cde.json") 	// big 29455
		.mimeType("application/json")
		.response(function(xhr) {
			GD_data = xhr.responseText;
			document.getElementById("process").click();
		})
		.get()
	;
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
			.center([150, 30])
			.scale(350);
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
			.on("mouseover", function (d, i) {
				console.log(d.properties);
				console.log(GD_prov[d.properties.id])
			})
			.on("mouseout", function (d, i) {

			});
}

/**
 * 动态添加节点
 */
var begin_time;
var eng_time;
function process(data) {
	var per = 1000;
	var count = data.length;
	GD_prov['total'] = count;
	var index = 0;
	begin_time = new Date();
	console.log(begin_time);
	G_timer = setInterval(function(){
		var count = Math.ceil(Math.random() * 100);
		if (GD_nodes.length == data.length) { clearInterval(G_timer); }
		while (count > 0) {
			try {
				var s = data[index]['source'];
				if (GD_wbids.indexOf(s.id) == -1) {
					add_node(s);
				}
				var t = data[index]['target'];
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
		end_time = new Date();
		console.log(end_time);
		console.log("total time: ", end_time-begin_time);
	}, per*count);
}

/**
 * 一次渲染全部
 */
function path(data) {
	var per = 1000;
	var count = data.length;
	var index = 0;
	for (var i = 0; i < count; i++) {
		var s = data[index]['source'];
		if (GD_wbids.indexOf(s.id) == -1) {
			add_node(s);
		}
		var t = data[index]['target'];
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
	switch (G_scene) {
		case "path":
			nodes
				 .on("mouseover", hilight_spread_path)
				 .on("mouseout", clear_hilight)
				 .on("click", null)
			; break ;
		case "process":
			nodes
				 .on("mouseover", hilight_spread_path)
				 .on("mouseout", clear_hilight)
				 .on("click", show_node_info)
			; break ;
		case "predict":
			nodes
				 // .on("mouseover", null)
				 .on("mouseout", null)
				 .on("mouseover", predict_retweet)
			; break ;
	}
}

function show_node_info(d){
	console.log(d);
}

function predict_retweet(d){
	console.log(d);
	for (var i = 0; i < 5; i++) {
		add_random_node(d);
	}
}

/**
 * 高亮传播路径
 */
function hilight_spread_path(d){
	var depth = d.depth;
	var parent = d.parent;
	var result = [d.id];
	while (parent != "null") {
		GD_node_level[--depth].forEach(function(item, index){
			if (item.id == parent) {
				result.push(parent);
				parent = item.parent;
			}
		})
	}
	G_nodes.classed('hide', function(d){
		if (result.indexOf(d.id) == -1) {
			return true;
		}
	});
	G_links.classed('hide', function(l){
		console.log(l);
		st = l.id.split('-')
		if (result.indexOf(st[0]) == -1 || result.indexOf(st[1]) == -1) {
			return true;
		}
	})
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
 */
function add_random_node(node){
	var id;
	while (true) {
		id = Math.round(Math.random() * 1000) + "";
		if (GD_wbids.indexOf(id) == -1) {
			break;
		}
	}
	console.log(node);
	var new_node = {
		"id": id,
		"depth": node.depth + 1,
		"parent": node.id
	}
	add_node(new_node);
	var link = {
		"id": node.id + '-' + id,
		"type": "predict",
		"source": node.id,
		"target": id
	}
	add_link(link);
	restart();
}
