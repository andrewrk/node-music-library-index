// usage: node benchmark.js path/to/index.json ["search query" ...]

var fs = require('fs');
var MusicLibraryIndex = require('../');

var indexPath = process.argv[2];
fs.readFile(indexPath, function(err, data) {
  if (err) throw err;

  var input = JSON.parse(data);
  var library = new MusicLibraryIndex();
  for (var key in input) {
    library.addTrack(input[key]);
  }
  timed("rebuild()", function() {
    library.rebuild();
  });
  for (var i = 3; i < process.argv.length; i++) {
    timedSearch(process.argv[i]);
  }

  function timedSearch(query) {
    timed("search(" + JSON.stringify(query) + ")", function() {
      library.search(query);
    });
  }
});

function timed(name, func) {
  process.stdout.write(name + "...");
  var start = new Date();
  func();
  var duration = new Date() - start;
  console.log(duration + "ms");
}
