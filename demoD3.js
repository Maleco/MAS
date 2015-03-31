// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = Array.prototype.equals || function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}

function initWorlds(numSpies, numResistance) {
  var players = numSpies + numResistance;
  var a = new Array(numSpies);
  var out = [];
  var i = 0;
  while (i < numSpies) a[i++] = 0;

  var sumFunc = function(a,b) {return a+b;}
  while (a.reduce(sumFunc,0) <= numResistance) {
    out.push(getSpies(a, numResistance));
    a[numSpies-1]++;
    for (i = numSpies-1; i > 0 && a.reduce(sumFunc,0) > numResistance; i--) {
      a[i] = 0;
      a[i-1]++;
    }
  }

  return out;
}

function getSpies(a, numResistance) {
  var numSpies = a.length;
  var spies = new Array(numSpies);
  spies[0] = a[0] + 1;
  for (var i = 1; i < numSpies; i++) spies[i] = spies[i-1] + a[i] + 1;
  var resistance = inverse(spies, numResistance);
  var s = spies.map(function(a){return a.toString();}).join("");
  var r = resistance.map(function(a){return a.toString();}).join("");
  return {spies: s, spiesRaw: spies, resistance: r, resistanceRaw: resistance};
}

function inverse(spyNums, numResistance) {
  var out = [];
  var numPlayers = spyNums.length + numResistance;
  for (var i = 1, j = 0; i <= numPlayers; i++) {
    if (j >= spyNums.length || spyNums[j] != i) {
      out.push(i);
    } else if (j < spyNums.length && spyNums[j] == i) {
      j++;
    }
  }
  return out;
}

/*******************************************************************************
 * GATHER ALL THE FUNCTIONS!!
*******************************************************************************/
	function setData(graph) {
		var butt = colorButtons.selectAll("button")
			.data(graph.playerList);
		butt.exit().remove();
		butt.enter().append("button")
			.text(function(d){ return "Focus "+d; })
			.attr("onclick", function(d){ return "colorMe("+d+");"; });

		force
			.nodes(graph.worlds)
			.links(graph.links)
			.start();

		svg.selectAll(".link").remove();
		var link = svg.selectAll(".link")
			.data(force.links())
			.enter().append("line")
			.attr("class", "link")
			.style("stroke", function(d){ return color(d.player); })
			.style("stroke-width", 2);

		svg.selectAll(".gnode").remove();
		var gnodes = svg.selectAll(".gnode")
			.data(force.nodes(), function(d) { return d.spies;});
		gnodes = gnodes
			.enter().append("g")
			.classed("gnode", true)
			.call(force.drag);

		var node = gnodes.insert("circle")
			.attr("class", "node")
			.attr("r", 15)
			.style("fill", function(d) { return d.reality ? "red" : "lightblue"; });

		var labels = gnodes.insert("text")
			.attr("text-anchor", "middle")
			.attr("x", 0)
			.attr("y", ".3em")
			.text(function(d) { return d.spies; });

		force.on("tick", function() {
				link.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

				gnodes.attr("transform", function(d) {
					return "translate(" + [d.x, d.y] + ")";
					});
				});
	}

function colorMe(p) {
	if (p === undefined) {
		svg.selectAll(".link")
			.style("stroke", function(d){ return color(d.player); })
			.style("stroke-width", 2);
	} else {
		svg.selectAll(".link")
			.style("stroke", function(d){ return d.player == p ? color(d.player) : "#eee"; })
			.style("stroke-width", function(d){ return d.player == p ? 3 : 1; });
	}
}

function findWorld(w, graph) {
	var worldNdx = undefined;
	for (var i = 0; i < graph.worlds.length; i++) {
		var world = graph.worlds[i];
		if (world === w || world.spies === w) {
			worldNdx = i;
			break;
		}
	}
	return worldNdx;
}

function removeWorld(w, graph) {
	var worldNdx = findWorld(w, graph);
	if (worldNdx === undefined) {
		console.log("Could not find world "+w);
		return false;
	}
	var world = graph.worlds[worldNdx];
	graph.worlds.splice(worldNdx, 1);
	for (var i = 0; i < graph.links.length; i++) {
		var link = graph.links[i];
		if (link.source === world || link.target === world) {
			graph.links.splice(i, 1);
			i--;
		}
	}
	return true;
}

function knownGood(player, graph) {
	for (var i = 0; i < graph.worlds.length; i++) {
		var world = graph.worlds[i];
		if (world.spies.indexOf(player) >= 0 || world.spiesRaw.indexOf(player) >= 0) {
			console.log(world);
			if (!removeWorld(world.spies, graph)) {
				console.log("WTF? "+i);
				return;
			}
			i--;
		}
	}
}

function knownBad(player, graph) {
	for (var i = 0; i < graph.worlds.length; i++) {
		var world = graph.worlds[i];
		if (world.resistance.indexOf(player) >= 0 || world.resistanceRaw.indexOf(player) >= 0) {
			console.log(world);
			if (!removeWorld(world.spies, graph)) {
				console.log("WTF? "+i);
				return;
			}
			i--;
		}
	}
}

// Find the length of the longest common subsequence of a and b. Assumes a and b are in sorted order.
function lenLCS(a, b) {
	var out = 0;
	for (var i = 0, j = 0; i < a.length && j < b.length; ) {
		if (a[i] == b[j]) {
			out++;
			i++;
			j++;
		} else if (a[i] < b[j]) {
			i++;
		} else {
			j++;
		}
	}
	console.log(a+" "+b+" "+out);
	return out;
}

function filterLenLCS(missionTeam, graph, f) {
	for (var i = 0; i < graph.worlds.length; i++) {
		var world = graph.worlds[i];
		if (!f(lenLCS(world.spies,missionTeam))) {
			if (!removeWorld(world.spies, graph)) {
				console.log("WTF? "+i);
				console.log(world);
				return;
			} else {
				console.log("Removing "+world.spies);
			}
			i--;
		}
	}
}

function missionResults(missionTeam, numFails, forceFail, seeFails) {
	missionTeam = missionTeam.split("").sort().join("");
	if (numFails == 0) {
		if (forceFail) {
			filterLenLCS(missionTeam, graph, function(f) { return f == 0; });
		}
	} else {
		if (seeFails) {
			filterLenLCS(missionTeam, graph, function(f) { return f == numFails; });
		} else {
			filterLenLCS(missionTeam, graph, function(f) { return f != 0; });
		}
	}

	setData(graph);
}

var graph = {};
function initKripke(spies, resistance) {
	graph.playerList = new Array(spies+resistance);
	for (var i = 0; i < spies+resistance; i++) {
		graph.playerList[i] = i+1;
	}

	graph.worlds = initWorlds(spies,resistance);

	graph.players = {};
	for (var i = 0; i < graph.worlds.length; i++) {
		var world = graph.worlds[i];
		for (var j in world.resistance) {
			var player = world.resistance[j];
			(graph.players[player] = graph.players[player] || []).push(world);
		}
	}

	graph.links = [];
	for (var player in graph.players) {
		var ws = graph.players[player];
		for (var i = 0; i < ws.length; i++) {
			for (var j = i+1; j < ws.length; j++) {
				graph.links.push({source: ws[i], target: ws[j], player: player});
			}
		}
	}

	//nodes[0].reality = true;

	setData(graph);
}
