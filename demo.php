<html>
<head>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js"></script>
<script src="//getspringy.com/springy.js"> </script>
<script src="//getspringy.com/springyui.js"> </script>
<style>
body {
   width: 99%;
   height: 99%;
}
canvas {
   width: 100%;
   height: 90%;
}
</style>
</head>
<body>

<canvas id="my_canvas" width="1200px" height="900"> </canvas>
<br>
<button onClick="my_focus('1')">Focus P1</button>
<button onClick="my_focus('2')">Focus P2</button>
<button onClick="my_focus('3')">Focus P3</button>
<button onClick="my_focus('4')">Focus P4</button>
<button onClick="my_focus('5')">Focus P5</button>
<button onClick="colorize()">Colorize</button>
<button onClick="init()">ReInit</button>

<script>
// make a new graph
var graph = new Springy.Graph();

// make some nodes
var a = graph.newNode({label: '11000'});
var b = graph.newNode({label: '10100'});
var c = graph.newNode({label: '10010'});
var d = graph.newNode({label: '10001'});
var e = graph.newNode({label: '01100'});
var f = graph.newNode({label: '01010'});
var g = graph.newNode({label: '01001'});
var h = graph.newNode({label: '00110'});
var i = graph.newNode({label: '00101'});
var j = graph.newNode({label: '00011'});

function addS5Edges(nodes, label, color) {
   for (var i = 0; i < nodes.length; i++) {
      for (var j = i+1; j < nodes.length; j++) {
         graph.newEdge(nodes[i], nodes[j], {'label': label, 'color': color});
      }
   }
}

function colorize() {
   graph.edges.forEach(function (edge) {
      if (edge.data.label == '1') {
         edge.data.color = '#FF0000';
      } else if (edge.data.label == '2') {
         edge.data.color = '#0000FF';
      } else if (edge.data.label == '3') {
         edge.data.color = '#00FF00';
      } else if (edge.data.label == '4') {
         edge.data.color = '#FF6600';
      } else if (edge.data.label == '5') {
         edge.data.color = '#FF00FF';
      }
   });
   graph.notify();
}

function my_focus(label) {
   colorize();
   graph.edges.forEach(function (edge) {
      if (edge.data.label != label) {
         edge.data.color = "#DDDDDD";
      }
   });
   graph.notify()
}

setTimeout(function() {addS5Edges([e,f,g,h,i,j],'1', '#FF0000')}, 0000);
setTimeout(function() {addS5Edges([b,c,d,h,i,j],'2', '#0000FF')  }, 3000);
setTimeout(function() {addS5Edges([a,c,d,f,g,j],'3', '#00FF00') }, 6000);
setTimeout(function() {addS5Edges([a,b,d,e,g,i],'4', '#FF6600')}, 9000);
setTimeout(function() {addS5Edges([a,b,c,e,f,h],'5', '#FF00FF')}, 12000);

function init() {
   graph.nodes.forEach(function (node) {
      graph.detachNode(node);
   });
   addS5Edges([e,f,g,h,i,j],'1', '#FF0000')   
   addS5Edges([b,c,d,h,i,j],'2', '#0000FF')  
   addS5Edges([a,c,d,f,g,j],'3', '#00FF00') 
   addS5Edges([a,b,d,e,g,i],'4', '#FF6600')
   addS5Edges([a,b,c,e,f,h],'5', '#FF00FF')
}

$('#my_canvas').springy({ graph: graph });
</script>
</body>
</html>
