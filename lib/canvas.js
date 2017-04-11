
// http://www.decembercafe.org/demo/relation/

var canvas;

function render() {
	canvas.clearRect()
}

var nodes;
var timer = setInterval(function(){
	if (nodes == G_nodes._groups[0].length) {
		clearInterval(timer);
	}
	nodes = G_nodes._groups[0].length;
	console.log(nodes);
}, 5000)

