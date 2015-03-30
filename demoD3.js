function initWorlds(spies, resistance) {
  var players = spies + resistance;
  var a = new Array(spies);
  var out = [];
  var i = 0;
  while (i < spies) a[i++] = 0;

  console.log('here');
  var sumFunc = function(a,b) {return a+b;}
  while (a.reduce(sumFunc,0) <= resistance) {
    console.log(getSpies(a));
    out.push(getSpies(a));
    a[spies-1]++;
    for (i = spies-1; i > 0 && a.reduce(sumFunc,0) > resistance; i--) {
      a[i] = 0;
      a[i-1]++;
    }
  }

  return out;
}

function getSpies(a) {
  var spies = a.length;
  var out = new Array(spies);
  out[0] = a[0];
  for (var i = 1; i < spies; i++) out[i] = out[i-1] + a[i] + 1;
  return out.map(function(a){return a.toString();}).join("");
}
