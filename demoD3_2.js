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
  this.container.classed("kcontainer",true);

  this.force = d3.layout.force()
      .charge(-5000)
      .linkDistance(150)
      .friction(.95)
      .gravity(.18)
      .size([width, height]);

  var kripkeDiv = this.container.append("div")
      .classed("kripke", true);
  this.svg = kripkeDiv.append("svg")
      .attr("width", width)
      .attr("height", height);

  kripkeDiv.append("div")
      .classed("ktoggle", true)
    .append("input")
      .attr("type","button")
      .attr("value","Toggle Controls")
      .on("click", function() { vis.toggleControls(); });

  //TODO: ktable and color button stuff
  //var colorButtons = container
  //  .append("div")
  //    .classed("colorButtons", true);

  var ktable = this.container
    .append("div")
      .classed("ktable", true)
    .append("table")
      .on("mouseout", function() { vis.focus(); });
  this.kheader = ktable.append("thead").append("tr");
  this.kbody = ktable.append("tbody");

  // Controls
  this.kcontrols = this.container
    .append("div")
      .classed("kcontrols", true)
      .classed("khidden", true);

  var kform = this.kcontrols.append("form");
  this.controlsHidden = true;
  this.missionTeamInput = kform.append("input")
      .attr("type","text")
      .attr("size","10")
      .attr("placeholder", "Mission team?")[0][0];
  this.numFailsInput = kform.append("input")
      .attr("type","number")
      .attr("size","1")
      .attr("placeholder", "Number of fails?")[0][0];
  kform.append("input")
      .attr("type","button")
      .attr("value","Go on a mission!")
      .on("click",function() { vis.goOnAMissionUI(); });

  kform.append("text").text(" ");
  this.backButton = kform.append("input")
      .attr("type","button")
      .attr("value","<<")
      .on("click",function() { vis.goBack(); });
  this.forwardButton = kform.append("input")
      .attr("type","button")
      .attr("value",">>")
      .on("click",function() { vis.goForward(); });
  kform.append("text").text(" ");
  kform.append("input")
      .attr("type","button")
      .attr("value","New Game")
      .on("click",function() { vis.initGameUI(); });
}

Visualization.prototype.initGame = function(numSpies, numResistance, forceFail, seeFails) {
  this.history = [];
  this.histNdx = -1;
  return this.pushGameState(new GameState(numSpies, numResistance, forceFail, seeFails));
}

Visualization.prototype.initGameUI = function(numSpies, numResistance, forceFail, seeFails) {
  var numSpies, numResistance, forceFail, seeFails;
  if ((numSpies = parseInt(prompt("Number of spies?", "2"))) == NaN) {
    return;
  }
  if ((numResistance = parseInt(prompt("Number of good guys?", "3"))) == NaN) {
    return;
  }
  forceFail = window.confirm("Force spies to fail?");
  seeFails = window.confirm("See number of failures?");
  return this.initGame(numSpies, numResistance, forceFail, seeFails);
}

Visualization.prototype.pushGameState = function(gameState) {
  this.currentGameState = gameState;
  this.histNdx++;
  this.history.splice(this.histNdx, this.history.length-this.histNdx, gameState);
  this.drawData();

  return this;
}

Visualization.prototype.drawData = function(gameState) {
  var vis = this;
  gameState = gameState || this.currentGameState;
  //TODO: ktable and color button stuff
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

  var numPlayers = gameState.playerList.length;
  // Set the table header
  var headerCells = this.kheader.selectAll("td")
      .data(gameState.playerList);

  headerCells.exit().remove();
  headerCells.enter().insert("td")
      .text(function(d) { return d; });

  headerCells
      .attr("width", this.width/numPlayers)
      .attr("height", this.height/(numPlayers+1))
      .on("mouseover", function(d) { vis.focus(d); })
      .style("background", function(d) { return vis.color(d); });

  // Set the table cells
  var tableRows = this.kbody.selectAll("tr")
      .data(gameState.playerList);

  tableRows.exit().remove();
  tableRows.enter().insert("tr");

  var tableCells = tableRows.selectAll("td")
      .data(gameState.playerList);

  tableCells.exit().remove();
  tableCells.enter().insert("td")
      .on("mouseover", function(d) { vis.focus(d); });

  this.kbody.selectAll("tr").selectAll("td")
      .attr("width", this.width/numPlayers)
      .attr("height", this.height/(numPlayers+1))
      .text(function(d, i, j) { return j+1; })
      .style("background", function(a,b,c) {
        var p1 = b+1, p2 = c+1;
        var possible = gameState.spyKnowledge(p1,p2);
        return possible == 2 ? "#222" : possible > 0 ? "red" : possible < 0 ? "green" : "yellow";
      });

  this.backButton.attr("disabled", (this.histNdx > 0 ? null : true));
  this.forwardButton.attr("disabled", (this.histNdx < this.history.length-1 ? null : true));
}

Visualization.prototype.goOnAMission = function(missionTeam, numFails) {
  return this.pushGameState(this.currentGameState.missionResults(missionTeam, numFails));
}

Visualization.prototype.goOnAMissionUI = function() {
  return this.goOnAMission(this.missionTeamInput.value, this.numFailsInput.value);
}

Visualization.prototype.toggleControls = function() {
  if (this.kcontrols.classed("khidden")) {
    this.kcontrols.classed("khidden",false);
  } else {
    this.kcontrols.classed("khidden",true);
  }
  return this;
}
Visualization.prototype.hideControls = function() {
  this.kcontrols.classed("khidden", true);
  return this;
}

Visualization.prototype.showControls = function() {
  this.kcontrols.classed("khidden", false);
  return this;
}

Visualization.prototype.histJump = function(i) {
  if (i >= 0 && i < this.history.length) {
    this.histNdx = i;
    this.currentGameState = this.history[this.histNdx];
    this.drawData();
  } else {
    console.log("Your history doesn't support that.");
  }
  return this;
}

Visualization.prototype.goBack = function() {
  return this.histJump(this.histNdx-1);
}

Visualization.prototype.goForward = function() {
  return this.histJump(this.histNdx+1);
}

Visualization.prototype.focus = function(p) {
  var color = this.color;
  if (p === undefined) {
    this.svg.selectAll(".link")
        .style("stroke", function(d){ return color(d.player); })
        .style("stroke-width", null)
        .style("stroke-opacity", null);

    this.svg.selectAll(".node")
        .style("stroke-width", null)
        .style("stroke", null);
  } else {
    this.svg.selectAll(".link")
        .style("stroke", function(d){ return d.player == p ? color(d.player) : "#eee"; })
        .style("stroke-width", function(d){ return d.player == p ? 3 : 1; })
        .style("stroke-opacity", function(d){ return d.player == p ? 1 : 0.2; });

    this.svg.selectAll(".node")
        .style("stroke-width", function(d){ return d.spies.indexOf(p) == -1 ? "3px" : null; })
        .style("stroke", function(d){ return d.spies.indexOf(p) == -1 ? color(p) : null; });
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
  this.label = "Game init: "+numSpies+" spies, "+numResistance+" good, "+(forceFail?"":"don't ")+"force failure, "+(seeFails?"":"don't ")+"see fails";

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
      if (out.forceFail) {
        out.filterLenLCS(missionTeam, function(f) { return f == numFails; });
      } else {
        out.filterLenLCS(missionTeam, function(f) { return f >= numFails; });
      }
    } else {
      out.filterLenLCS(missionTeam, function(f) { return f != 0; });
    }
  }
  out.label = "Mission: "+missionTeam+" with "+numFails+" failure"+(numFails == 1? "" : "s");

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
// Returns 2 if p1 is outed as a spy.
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
  return myWorldCount == 0 ? 2 : count == 0 ? -1 : count < myWorldCount ? 0 : 1;
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
