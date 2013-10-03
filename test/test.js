var assert = require('assert');
var MusicLibraryIndex = require('../');

describe("basic index building", function() {
  var library = new MusicLibraryIndex();

  library.addTrack({
    key: "Anberlin/Never Take Friendship Personal/02. Paperthin Hymn.mp3",
    name: "Paperthin Hymn",
    artistName: "Anberlin",
    albumName: "Never Take Friendship Personal",
    year: 2005,
    genre: "Other",
    track: 2,
    albumArtistName: "Anberlin",
  });

  library.addTrack({
    key: "Anberlin/Never Take Friendship Personal/08. The Feel Good Drag.mp3",
    name: "The Feel Good Drag",
    artistName: "Anberlin",
    albumName: "Never Take Friendship Personal",
    year: 2005,
    genre: "Other",
    track: 8,
    albumArtistName: "Anberlin",
  });

  library.rebuild();

  it("trackTable", function() {
    var track = library.trackTable["Anberlin/Never Take Friendship Personal/08. The Feel Good Drag.mp3"];
    assert.strictEqual(track.name, "The Feel Good Drag");
    assert.strictEqual(track.artistName, "Anberlin");
    assert.strictEqual(track.album.name, "Never Take Friendship Personal");
    assert.strictEqual(track.year, 2005);
  });

  it("artistList", function() {
    assert.strictEqual(library.artistList.length, 1);
    var artist = library.artistList[0];
    assert.strictEqual(artist.name, "Anberlin");
    assert.strictEqual(artist.index, 0);
    assert.strictEqual(artist.albumList.length, 1);
    var album = artist.albumList[0];
    assert.strictEqual(album.name, "Never Take Friendship Personal");
    assert.strictEqual(album.year, 2005);
    assert.strictEqual(album.index, 0);
    assert.strictEqual(album.trackList.length, 2);
    assert.strictEqual(album.trackList[0].name, "Paperthin Hymn");
    assert.strictEqual(album.trackList[0].index, 0);
    assert.strictEqual(album.trackList[1].name, "The Feel Good Drag");
    assert.strictEqual(album.trackList[1].index, 1);
  });

  it("albumList", function() {
    assert.strictEqual(library.albumList.length, 1);
    var album = library.albumList[0];
    assert.strictEqual(album.name, "Never Take Friendship Personal");
    assert.strictEqual(album.year, 2005);
    assert.strictEqual(album.index, 0);
    assert.strictEqual(album.trackList.length, 2);
    assert.strictEqual(album.trackList[0].name, "Paperthin Hymn");
    assert.strictEqual(album.trackList[0].index, 0);
    assert.strictEqual(album.trackList[1].name, "The Feel Good Drag");
    assert.strictEqual(album.trackList[1].index, 1);
  });
});
