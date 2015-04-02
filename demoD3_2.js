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

function Visualization(containerId, width, height) {
  var vis = this;
  this.containerId = containerId;

  this.width = width = width || 400;
  this.height = height = height || 400;
  this.color = d3.scale.category10();

  this.container = d3.select(containerId);

  this.force = d3.layout.force()
      .charge(-5000)
      .linkDistance(150)
      .friction(.95)
      .gravity(.18)
      .size([width, height]);

  this.svg = this.container
    .append("svg")
      .attr("width", width)
      .attr("height", height);

  //TODO: ktable and color button stuff
  //var colorButtons = container
  //  .append("div")
  //    .classed("colorButtons", true);

  //this.ktable = container
  //  .append("table")
  //    .attr("onmouseout", function() { console.log("Here... focused?"); vis.focus(); });
  //this.kheader = ktable.append("theader");
  //this.kbody = ktable.append("tbody");
}

Visualization.prototype.initGame = function(numSpies, numResistance, forceFail, seeFails) {
  //TODO
  this.history = [];
  this.histNdx = -1;
  this.pushGameState(new GameState(numSpies, numResistance, forceFail, seeFails));

  return this;
}

Visualization.prototype.pushGameState = function(gameState) {
  //TODO: Remove previous entries.
  this.currentGameState = gameState;
  this.history.splice(this.histNdx, this.history.length-this.histNdx, gameState);
  this.histNdx++;
  this.drawData();

  return this;
}

Visualization.prototype.drawData = function(gameState) {
  var vis = this;
  gameState = gameState || this.currentGameState;
  console.log(gameState);
  //TODO: ktable and color button stuff
  console.log(gameState);
  this.force
      .nodes(gameState.worlds)
      .links(gameState.links)
      .start();

  this.svg.selectAll(".link").remove();
  var link = this.svg.selectAll(".link")
      .data(this.force.links())
    .enter().append("line")
      .classed("link", true)
      .style("stroke", function(d){ return vis.color(d.player); })
      .style("stroke-width", 2);

  this.svg.selectAll(".gnode").remove();
  var gnodes = this.svg.selectAll(".gnode")
      .data(this.force.nodes(), function(d) { return d.spies;})
    .enter().append("g")
      .classed("gnode", true)
      // Don't set node to fixed on mouseover.
      // This is a hack taken from http://jsfiddle.net/InferOn/5wssqqdw/1/
      // Not sure what the "proper" way to disable force.drag()'s mouseover is...
      .call(this.force.drag().on("drag",function(d){}));

  var node = gnodes.insert("circle")
      .attr("class", "node")
      .attr("r", 15)
      .style("fill", function(d) { return d.reality ? "red" : "lightblue"; });

  var labels = gnodes.insert("text")
      .attr("text-anchor", "middle")
      .attr("x", 0)
      .attr("y", ".3em")
      //TODO: Change to d.label
      .text(function(d) { return d.spies; });

  this.force.on("tick", function() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    gnodes.attr("transform", function(d) {
      return "translate(" + [d.x, d.y] + ")";
    });
  });
}

Visualization.prototype.goOnAMission = function(missionTeam, numFails) {
  this.pushGameState(this.currentGameState.missionResults(missionTeam, numFails));

  return this;
}

Visualization.prototype.goBack = function() {
  if (this.histNdx > 0) {
    this.histNdx--;
    this.currentGameState = this.history[this.histNdx];
    this.drawData();
  }
  return this;
}

Visualization.prototype.goForward = function() {
  //TODO
  if (this.histNdx < this.history.length-1) {
    this.histNdx++;
    this.currentGameState = this.history[this.histNdx];
    this.drawData();
  }
  return this;
}

Visualization.prototype.focus = function(p) {
  console.log("Inside focus.");
  if (p === undefined) {
    this.svg.selectAll(".link")
        .style("stroke", function(d){ return color(d.player); })
        .style("stroke-width", 2);
  } else {
    this.svg.selectAll(".link")
        .style("stroke", function(d){ return d.player == p ? color(d.player) : "#eee"; })
        .style("stroke-width", function(d){ return d.player == p ? 3 : 1; });
  }
}


function GameState(numSpies, numResistance, forceFail, seeFails) {
  //TODO
  if (numSpies === undefined) {
    return;
  }
  this.numSpies = numSpies;
  this.numResistance = numResistance;
  this.numPlayers = numSpies + numResistance;
  this.forceFail = forceFail;
  this.seeFails = seeFails;

  this.playerList = new Array(this.numPlayers);
  for (var i = 0; i < this.numPlayers; i++) {
    this.playerList[i] = i+1;
  }

  this.worlds = initWorlds(numSpies,numResistance);

  var playerToWorlds = {};
  for (var i = 0; i < this.worlds.length; i++) {
    var world = this.worlds[i];
    for (var j in world.resistance) {
      var player = world.resistance[j];
      (playerToWorlds[player] = playerToWorlds[player] || []).push(world);
    }
  }

  this.links = [];
  for (var player in playerToWorlds) {
    var ws = playerToWorlds[player];
    for (var i = 0; i < ws.length; i++) {
      for (var j = i+1; j < ws.length; j++) {
        this.links.push({source: ws[i], target: ws[j], player: player});
      }
    }
  }
}

GameState.prototype.clone = function() {
  var out = new GameState();
  out.numSpies = this.numSpies;
  out.numResistance = this.numResistance;
  out.playerList = this.playerList;
  out.numPlayers = this.numPlayers;
  out.forceFail = this.forceFail;
  out.seeFails = this.seeFails;
  out.worlds = new Array(this.worlds.length);
  for (var i = 0; i < this.worlds.length; i++) {
    out.worlds[i] = this.worlds[i];
  }
  out.links = new Array(this.links.length);
  for (var i = 0; i < this.links.length; i++) {
    out.links[i] = this.links[i];
  }

  return out;
}

GameState.prototype.missionResults = function(missionTeam, numFails) {
  var out = this.clone();

  missionTeam = missionTeam.split("").sort().join("");
  if (numFails == 0) {
    if (out.forceFail) {
      out.filterLenLCS(missionTeam, function(f) { return f == 0; });
    }
  } else {
    if (out.seeFails) {
      out.filterLenLCS(missionTeam, function(f) { return f == numFails; });
    } else {
      out.filterLenLCS(missionTeam, function(f) { return f != 0; });
    }
  }

  return out;
}

GameState.prototype.filterLenLCS = function(missionTeam, f) {
  for (var i = 0; i < this.worlds.length; i++) {
    var world = this.worlds[i];
    if (!f(lenLCS(world.spies,missionTeam))) {
      if (!this.removeWorld(world.spies)) {
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

GameState.prototype.findWorld = function(w) {
  var worldNdx = undefined;
  for (var i = 0; i < this.worlds.length; i++) {
    var world = this.worlds[i];
    if (world === w || world.spies === w) {
      worldNdx = i;
      break;
    }
  }
  return worldNdx;
}

GameState.prototype.removeWorld = function(w) {
  var worldNdx = this.findWorld(w);
  if (worldNdx === undefined) {
    console.log("Could not find world "+w);
    return false;
  }
  var world = this.worlds[worldNdx];
  this.worlds.splice(worldNdx, 1);
  for (var i = 0; i < this.links.length; i++) {
    var link = this.links[i];
    if (link.source === world || link.target === world) {
      this.links.splice(i, 1);
      i--;
    }
  }
  return true;
}


// Returns -1 if p1 knows p2 is not a spy.
// Returns 0 if p1 holds it possible that p2 is a spy, but is not sure.
// Returns 1 if p1 knows p2 is a spy.
GameState.prototype.spyKnowledge = function(p1, p2) {
  //TODO: Handle case where p1 is a spy.
  var worlds = this.worlds;
  var count = 0, myWorldCount = 0;
  for (var i = 0; i < worlds.length; i++) {
    if (worlds[i].spies.indexOf(p1) == -1) {
      myWorldCount++;
      if(worlds[i].spies.indexOf(p2) != -1) {
        count++;
      }
    }
  }
  return myWorldCount == 0 ? 1 : count == 0 ? -1 : count < myWorldCount ? 0 : 1;
}



function initWorlds(numSpies, numResistance) {
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

function colorMe(p) {
  if (p === undefined) {
    <!-- END FIRST ANALYSIS SLIDE -->
    svg.selectAll(".link")
    .style("stroke", function(d){ return color(d.player); })
    .style("stroke-width", 2);
  } else {
    svg.selectAll(".link")
    .style("stroke", function(d){ return d.player == p ? color(d.player) : "#eee"; })
    .style("stroke-width", function(d){ return d.player == p ? 3 : 1; });
  }
}

function knownGood(player, graph) {
  for (var i = 0; i < graph.worlds.length; i++) {
    var world = graph.worlds[i];
    if (world.spies.indexOf(player) >= 0 || world.spiesRaw.indexOf(player) >= 0) {
      if (!removeWorld(world.spies, graph)) {
        console.log(world);
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
      if (!removeWorld(world.spies, graph)) {
        console.log(world);
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
