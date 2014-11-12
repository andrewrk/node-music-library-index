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

  it("searching", function() {
    var results = library.search("never drag");

    assert.strictEqual(results.albumList.length, 1);
    assert.strictEqual(results.albumList[0].trackList.length, 1);
    assert.strictEqual(results.albumList[0].trackList[0].name, "The Feel Good Drag");
  });
});

describe("compilation album", function() {
  var library = new MusicLibraryIndex();

  library.addTrack({
    key: "jqvq-tpiu",
    name: "No News Is Good News",
    artistName: "New Found Glory",
    albumName: "2004 Warped Tour Compilation [Disc 1]",
    year: 2004,
    disc: 1,
    discCount: 2,
    genre: "Alternative & Punk",
    albumArtistName: "Various Artists",
    track: 1,
  });

  library.addTrack({
    key: "dldd-itve",
    name: "American Errorist (I Hate Hate Haters)",
    artistName: "NOFX",
    albumName: "2004 Warped Tour Compilation [Disc 1]",
    year: 2004,
    disc: 1,
    discCount: 2,
    genre: "Alternative & Punk",
    albumArtistName: "Various Artists",
    track: 2,
  });

  library.addTrack({
    key: "ukjv-ndsz",
    name: "Fire Down Below",
    artistName: "Alkaline Trio",
    albumName: "2007 Warped Tour Compilation [Disc 1]",
    compilation: true,
    year: 2007,
    genre: "Alternative & Punk",
    track: 1,
    trackCount: 25,
  });

  library.addTrack({
    key: "gfkt-esqz",
    name: "Requiem For Dissent",
    artistName: "Bad Religion",
    albumName: "2007 Warped Tour Compilation [Disc 1]",
    compilation: true,
    year: 2007,
    genre: "Alternative & Punk",
    track: 2,
    trackCount: 25,
  });

  library.rebuild();

  it("filed in various artists", function() {
    assert.strictEqual(library.albumList.length, 2);
    assert.strictEqual(library.artistList.length, 1);
    var artist = library.artistList[0];
    assert.strictEqual(artist.name, "Various Artists");
    assert.strictEqual(artist.albumList.length, 2);
    assert.strictEqual(library.albumList.length, 2);
    assert.strictEqual(library.trackTable["jqvq-tpiu"].albumArtistName, "");
    assert.strictEqual(library.trackTable["dldd-itve"].albumArtistName, "");
    assert.strictEqual(library.trackTable["ukjv-ndsz"].albumArtistName, "");
    assert.strictEqual(library.trackTable["gfkt-esqz"].albumArtistName, "");
  });
});

describe("tracks from same album missing year metadata", function() {
  var library = new MusicLibraryIndex();

  library.addTrack({
    key: "wwxj-unhr",
    name: "Dog-Eared Page",
    artistName: "The Matches",
    albumName: "E. Von Dahl Killed the Locals",
    year: 2004,
    genre: "Punk",
    track: 1,
  });

  library.addTrack({
    key: "xekw-lvne",
    name: "Audio Blood",
    artistName: "The Matches",
    albumName: "E. Von Dahl Killed the Locals",
    // missing year
    genre: "Rock",
    track: 2,
  });

  library.addTrack({
    key: "lpka-dugc",
    name: "Chain Me Free",
    artistName: "The Matches",
    albumName: "E. Von Dahl Killed the Locals",
    year: 2004,
    genre: "Rock",
    track: 3,
  });

  library.rebuild();

  it("still knows they're in the same album", function() {
    assert.strictEqual(library.albumList.length, 1);
    assert.strictEqual(library.albumList[0].year, 2004);
    assert.strictEqual(library.trackTable["xekw-lvne"].album.year, 2004);
  });
});

describe("different albums with same name", function() {
  var library = new MusicLibraryIndex();

  library.addTrack({
    key: "sbao-lcvn",
    name: "6:00",
    artistName: "Dream Theater",
    albumName: "Awake",
    year: 1994,
    genre: "Progressive Rock",
    track: 1,
  });

  library.addTrack({
    key: "qtru-gdtp",
    name: "Awake",
    artistName: "Godsmack",
    albumName: "Awake",
    year: 2000,
    genre: "Rock",
    track: 2,
  });

  library.rebuild();

  it("detects that they are different", function() {
    assert.strictEqual(library.albumList.length, 2);
  });
});

describe("album with a few tracks by different artists", function() {
  var library = new MusicLibraryIndex();

  library.addTrack({
    key: "ikoe-nujf",
    name: "Paperthin Hymn",
    artistName: "Anberlin",
    albumArtistName: "Anberlin",
    albumName: "Never Take Friendship Personal",
    year: 2005,
    genre: "Other",
    track: 2,
  });

  library.addTrack({
    key: "msnq-swpc",
    name: "The Feel Good Drag",
    artistName: "Anberlin, some other band",
    albumArtistName: "Anberlin",
    albumName: "Never Take Friendship Personal",
    year: 2005,
    genre: "Other",
    track: 8,
  });


  library.rebuild();

  it("only creates one album", function() {
    assert.strictEqual(library.albumList.length, 1);
  });
});

describe("album by an artist", function() {
  var library = new MusicLibraryIndex();

  library.addTrack({
    key: "ynji-lcfu",
    name: "The Truth",
    artistName: "Relient K",
    albumName: "Apathetic ep",
    track: 1,
    trackCount: 7,
  });

  library.addTrack({
    key: "lxed-bsor",
    name: "Apathetic Way to Be",
    artistName: "Relient K",
    albumName: "Apathetic ep",
    track: 2,
    trackCount: 7,
  });


  library.rebuild();

  it("should be filed under the artist", function() {
    assert.strictEqual(library.artistList.length, 1);
    assert.strictEqual(library.artistList[0].name, "Relient K");
  });
});

describe("album by an artist", function() {
  var library = new MusicLibraryIndex();
  library.addTrack({
    key: "jqvq-tpiu",
    name: "No News Is Good News",
    artistName: "New Found Glory",
    albumName: "2004 Warped Tour Compilation",
    year: 2004,
    disc: 1,
    discCount: 2,
    genre: "Alternative & Punk",
    albumArtistName: "Various Artists",
    track: 1,
  });

  library.addTrack({
    key: "dldd-itve",
    name: "American Errorist (I Hate Hate Haters)",
    artistName: "NOFX",
    albumName: "2004 Warped Tour Compilation",
    year: 2004,
    disc: 1,
    discCount: 2,
    genre: "Alternative & Punk",
    albumArtistName: "Various Artists",
    track: 2,
  });

  library.addTrack({
    key: "ukjv-ndsz",
    name: "Fire Down Below",
    artistName: "Alkaline Trio",
    albumName: "2004 Warped Tour Compilation",
    disc: 2,
    compilation: true,
    year: 2004,
    genre: "Alternative & Punk",
    track: 1,
    trackCount: 25,
  });

  library.addTrack({
    key: "gfkt-esqz",
    name: "Requiem For Dissent",
    artistName: "Bad Religion",
    albumName: "2004 Warped Tour Compilation",
    disc: 2,
    compilation: true,
    year: 2004,
    genre: "Alternative & Punk",
    track: 2,
    trackCount: 25,
  });

  library.rebuild();

  it("sorts by disc before track", function() {
    assert.strictEqual(library.albumList[0].trackList[0].name, "No News Is Good News");
    assert.strictEqual(library.albumList[0].trackList[1].name, "American Errorist (I Hate Hate Haters)");
    assert.strictEqual(library.albumList[0].trackList[2].name, "Fire Down Below");
    assert.strictEqual(library.albumList[0].trackList[3].name, "Requiem For Dissent");
  });
});

describe("album artist with no album", function() {
  var library = new MusicLibraryIndex();

  var id = '5a89ea73-71aa-4c22-97a5-3b3509131cca';
  library.addTrack({
    key: id,
    name: 'I Miss You',
    artistName: 'Blink 182',
    composerName: '',
    performerName: '',
    albumArtistName: 'blink-182',
    albumName: '',
    compilation: false,
    track: 3,
    duration: 227.6815,
    year: 2003,
    genre: 'Rock',
  });

  library.rebuild();

  it("shouldn't be various artists", function() {
    assert.notStrictEqual(library.trackTable[id].albumArtistName, "Various Artists");
  });
});

describe("unknown artist, unknown album", function() {
  var library = new MusicLibraryIndex();

  library.addTrack({
    key: 'imnd-sxde',
    name: '01 Shining Armor',
    artistName: '',
    albumArtistName: '',
    albumName: '',
  });

  library.addTrack({
    key: 'jakg-nbfg',
    name: '02 Weird Kids',
    artistName: '',
    albumArtistName: '',
    albumName: '',
  });

  library.rebuild();
  var results = library;

  it("should be put into the same album", check);

  library.search("n");
  results = library.search("");

  it("searching should not affect anything", check);

  function check() {
    assert.strictEqual(results.artistList.length, 1);
    assert.strictEqual(results.artistList[0].albumList.length, 1);
    assert.strictEqual(results.artistList[0].albumList[0].trackList.length, 2);
    assert.strictEqual(results.artistList[0].albumList[0].trackList[0].album.trackList.length, 2);
  }
});

describe("album with album artist", function() {
  var library = new MusicLibraryIndex();

  var id1 =  'imnd-sxde';
  library.addTrack({
    key: id1,
    name: 'Palladio',
    artistName: 'Escala',
    albumArtistName: 'Escala',
    albumName: 'Escala',
    track: 1,
  });

  var id2 = 'vewu-hqbx';
  library.addTrack({
    key: id2,
    name: 'Requiem for a Tower',
    artistName: 'Escala',
    albumArtistName: 'Escala',
    albumName: 'Escala',
    track: 2,
  });

  var id3 = 'ixbc-oshh';
  library.addTrack({
    key: id3,
    name: 'Kashmir',
    artistName: 'Escala; Slash',
    albumArtistName: 'Escala',
    albumName: 'Escala',
    track: 3,
  });
  library.rebuild();

  it("shouldn't be various artists", function() {
    assert.strictEqual(library.trackTable[id1].albumArtistName, "Escala");
    assert.strictEqual(library.trackTable[id2].albumArtistName, "Escala");
    assert.strictEqual(library.artistList.length, 1);
  });
});

describe("parseQuery", function() {
  it("works", function() {
    assert.strictEqual(MusicLibraryIndex.parseQuery("").toString(), '()');
    assert.strictEqual(MusicLibraryIndex.parseQuery("a").toString(), '(fuzzy "a")');
    assert.strictEqual(MusicLibraryIndex.parseQuery(" a   b ").toString(), '((fuzzy "a") AND (fuzzy "b"))');
    assert.strictEqual(MusicLibraryIndex.parseQuery("\"a  b\"").toString(), '(exact "a  b")');
    assert.strictEqual(MusicLibraryIndex.parseQuery("\"a  b\\\" c\"").toString(), '(exact "a  b\\\" c")');
    assert.strictEqual(MusicLibraryIndex.parseQuery("\\\"a  b\"").toString(), '((fuzzy "\\\"a") AND (fuzzy "b\\\""))');
    assert.strictEqual(MusicLibraryIndex.parseQuery("\"").toString(), '(fuzzy "\\\"")');
    assert.strictEqual(MusicLibraryIndex.parseQuery("\\").toString(), '(fuzzy "\\\\")');
    assert.strictEqual(MusicLibraryIndex.parseQuery("\"\"").toString(), '()');
    assert.strictEqual(MusicLibraryIndex.parseQuery("a\" b\"c").toString(), '((fuzzy "a\\\"") AND (fuzzy "b\\\"c"))');
    assert.strictEqual(MusicLibraryIndex.parseQuery("ab cd e").toString(), '((fuzzy "ab") AND (fuzzy "cd") AND (fuzzy "e"))');
  });
});

describe("searching with quoted seach terms", function() {
  var library = new MusicLibraryIndex();

  library.addTrack({
    key: "fUPmxjMc",
    name: "Été (Original Mix)",
    artistName: "AKA AKA & Thalstroem",
    albumName: "Varieté",
  });

  library.addTrack({
    key: "zyGaKkrU",
    name: "Tribute to Young Stroke AKA Young Muscle",
    artistName: "Andy Kelley",
    albumName: "The Weekend Challenge #3",
  });

  library.addTrack({
    key: "v7zwEPLs",
    name: "Mista veri pakenee",
    artistName: "Turmion Katilot (no diacritics)",
    albumName: "Pirun nyrkki",
  });
  library.addTrack({
    key: "sobHcy0I",
    name: "Mistä veri pakenee",
    artistName: "Turmion Kätilöt (with diacritics)",
    albumName: "Pirun nyrkki",
  });

  var literalQuoteKey = "G5FqXeJZ";
  library.addTrack({
    key: literalQuoteKey,
    name: "A song with a literal \" in it",
    artistName: "Tester",
    albumName: "literalQuote",
  });

  var literalBackslashKey = "Xsc4+ril";
  library.addTrack({
    key: literalBackslashKey,
    name: "A song with a literal \\ in it",
    artistName: "Tester",
    albumName: "literalBackslash",
  });

  library.rebuild();

  it("single search term returns both", function() {
    var results = library.search("aka aka");
    assert.strictEqual(results.artistList.length, 2);
  });

  it("quoted search term is case sensitive", function() {
    assert.strictEqual(library.search("\"andy\"").artistList.length, 0);
    assert.strictEqual(library.search("\"ANDY\"").artistList.length, 0);
    assert.strictEqual(library.search("\"Andy\"").artistList.length, 1);
  });

  it("quoted search terms include spaces", function() {
    var results = library.search("\"AKA AKA\"");
    assert.strictEqual(results.artistList.length, 1);
    assert.strictEqual(results.artistList[0].name, "AKA AKA & Thalstroem");
  });

  it("quoted search terms preserve diacritics", function() {
    assert.strictEqual(library.search("Mistä").artistList.length, 2);
    assert.strictEqual(library.search("\"Mistä\"").artistList.length, 1);
  });

  it("matches a song with a literal quote", function() {
    var results = library.search("\"");
    assert.strictEqual(results.albumList.length, 1);
    assert.strictEqual(results.albumList[0].trackList.length, 1);
    assert.strictEqual(results.albumList[0].trackList[0].key, literalQuoteKey);
  });
  it("matches a song with a literal backslash", function() {
    var results = library.search("\\");
    assert.strictEqual(results.albumList.length, 1);
    assert.strictEqual(results.albumList[0].trackList.length, 1);
    assert.strictEqual(results.albumList[0].trackList[0].key, literalBackslashKey);
  });
});
