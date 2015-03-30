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
  spies[0] = a[0];
  for (var i = 1; i < numSpies; i++) spies[i] = spies[i-1] + a[i] + 1;
  var resistance = inverse(spies, numResistance);
  var s = spies.map(function(a){return a.toString();}).join("");
  var r = resistance.map(function(a){return a.toString();}).join("");
  return {spies: s, spiesRaw: spies, resistance: r, resistanceRaw: resistance};
}

function inverse(spyNums, numResistance) {
  var out = [];
  var numPlayers = spyNums.length + numResistance;
  for (var i = 0, j = 0; i < numPlayers; i++) {
    if (j >= spyNums.length || spyNums[j] != i) {
      out.push(i);
    } else if (j < spyNums.length && spyNums[j] == i) {
      j++;
    }
  }
  return out;
}
