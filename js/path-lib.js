var meter = document.querySelector("#progress");

var width = 960,
	height = 600;
var context = d3.select("body").append("canvas")
	.attr("id", "canvas")
	.attr("width", width)
	.attr("height", height)
	.call(d3.zoom().scaleExtent([1, 8]).on("zoom", zoom))
	.on("mousemove", function(d) {
		var p = d3.mouse(this);
		var node = G_simulation.find(p[0], p[1]);
		console.log(p, node);
	})
	.node().getContext("2d");

document.getElementById("canvas").addEventListener("mouseover", function(event){
	console.log(event.layerX);
	console.log(event.layerY);
	mouseX = event.layerX;
	mouseY = event.layerY;
	// d3.event.subject
	var col = context.getImageData(mouseX, mouseY, 1, 1).data();
})

function over(){
	console.log(d3.event);

}

var worker = new Worker("js/path.js");

worker.onmessage = function(event) {
	switch (event.data.type) {
		case "tick": return ticked(event.data);
		case "end": return end(event.data);
	}
};

var GD_data;

d3.request("../data/path-link-85f0c2.json")
	.mimeType("application/json")
	.response(function(xhr) {
		GD_data = JSON.parse(xhr.responseText);
		worker.postMessage(GD_data);
	})
	.get()
;

function zoom() {
	context.save();
	context.clearRect(0, 0, width, height);
	context.translate(d3.event.transform.x, d3.event.transform.y);
	context.scale(d3.event.transform.k, d3.event.transform.k);
	draw();
	context.restore();
}


function ticked(data) {
	var progress = data.progress;
	meter.style.width = 100 * progress + "%";
}

function end(data) {
	GD_data = data;
	draw(GD_data);
}

function draw() {
	var nodes = GD_data.nodes,
	  	links = GD_data.links;

	meter.style.display = "none";

	context.clearRect(0, 0, width, height);
	context.save();
	context.translate(width / 2, height / 2);

	context.beginPath();
	links.forEach(drawLink);
	context.strokeStyle = "#aaa";
	context.stroke();

	context.beginPath();
	nodes.forEach(drawNode);
	context.fill();
	context.strokeStyle = "#fff";
	context.stroke();

	context.restore();
}

function drawLink(d) {
	context.moveTo(d.source.x, d.source.y);
	context.lineTo(d.target.x, d.target.y);
}

function drawNode(d) {
	context.moveTo(d.x + 3, d.y);
	context.arc(d.x, d.y, 3, 0, 2 * Math.PI);
}