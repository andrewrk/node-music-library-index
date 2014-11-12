var removeDiacritics = require('diacritics').remove;

module.exports = MusicLibraryIndex;

MusicLibraryIndex.defaultPrefixesToStrip = [
  /^\s*the\s+/,
  /^\s*a\s+/,
  /^\s*an\s+/,
];
MusicLibraryIndex.defaultVariousArtistsKey = "VariousArtists";
MusicLibraryIndex.defaultVariousArtistsName = "Various Artists";
MusicLibraryIndex.defaultSearchFields = [
  'artistName',
  'albumArtistName',
  'albumName',
  'name',
];
MusicLibraryIndex.parseQuery = parseQuery;
MusicLibraryIndex.tokenizeQuery = tokenizeQuery;

function MusicLibraryIndex(options) {
  options = options || {};
  this.searchFields = options.searchFields || MusicLibraryIndex.defaultSearchFields;
  this.variousArtistsKey = options.variousArtistsKey || MusicLibraryIndex.defaultVariousArtistsKey;
  this.variousArtistsName = options.variousArtistsName || MusicLibraryIndex.defaultVariousArtistsName;
  this.prefixesToStrip = options.prefixesToStrip || MusicLibraryIndex.defaultPrefixesToStrip;

  this.artistComparator = this.artistComparator.bind(this);
  this.albumComparator = this.albumComparator.bind(this);
  this.trackComparator = this.trackComparator.bind(this);
  this.clear();
}

MusicLibraryIndex.prototype.stripPrefixes = function(str) {
  for (var i = 0; i < this.prefixesToStrip.length; i += 1) {
    var regex = this.prefixesToStrip[i];
    str = str.replace(regex, '');
    break;
  }
  return str;
};

MusicLibraryIndex.prototype.sortableTitle = function(title) {
  return this.stripPrefixes(formatSearchable(title));
};

MusicLibraryIndex.prototype.titleCompare = function(a, b) {
  var _a = this.sortableTitle(a);
  var _b = this.sortableTitle(b);
  if (_a < _b) {
    return -1;
  } else if (_a > _b) {
    return 1;
  } else {
    if (a < b) {
      return -1;
    } else if (a > b) {
      return 1;
    } else {
      return 0;
    }
  }
};

MusicLibraryIndex.prototype.trackComparator = function(a, b) {
  if (a.disc < b.disc) {
    return -1;
  } else if (a.disc > b.disc) {
    return 1;
  } else if (a.track < b.track) {
    return -1;
  } else if (a.track > b.track) {
    return 1;
  } else {
    return this.titleCompare(a.name, b.name);
  }
}

MusicLibraryIndex.prototype.albumComparator = function(a, b) {
  if (a.year < b.year) {
    return -1;
  } else if (a.year > b.year) {
    return 1;
  } else {
    return this.titleCompare(a.name, b.name);
  }
}

MusicLibraryIndex.prototype.artistComparator = function(a, b) {
  return this.titleCompare(a.name, b.name);
}

MusicLibraryIndex.prototype.getAlbumKey = function(track) {
  var artistName = track.albumArtistName ||
    (track.compilation ? this.variousArtistsName : track.artistName);
  return formatSearchable(track.albumName + "\n" + artistName);
};

MusicLibraryIndex.prototype.getArtistKey = function(artistName) {
  return formatSearchable(artistName);
};

MusicLibraryIndex.prototype.clear = function() {
  this.trackTable = {};
  this.artistTable = {};
  this.artistList = [];
  this.albumTable = {};
  this.albumList = [];
  this.dirty = false;
  this.dirtyAlbumTable = false;
};

MusicLibraryIndex.prototype.rebuildAlbumTable = function() {
  if (!this.dirtyAlbumTable) return;

  // builds everything from trackTable
  this.artistTable = {};
  this.artistList = [];
  this.albumTable = {};
  this.albumList = [];
  var thisAlbumList = this.albumList;
  for (var trackKey in this.trackTable) {
    var track = this.trackTable[trackKey];
    this.trackTable[track.key] = track;

    var searchTags = "";
    for (var i = 0; i < this.searchFields.length; i += 1) {
      searchTags += track[this.searchFields[i]] + "\n";
    }
    track.exactSearchTags = searchTags;
    track.fuzzySearchTags = formatSearchable(searchTags);

    if (track.albumArtistName === this.variousArtistsName) {
      track.albumArtistName = "";
      track.compilation = true;
    }
    track.albumArtistName = track.albumArtistName || "";

    var albumKey = this.getAlbumKey(track);
    var album = getOrCreate(albumKey, this.albumTable, createAlbum);
    track.album = album;
    album.trackList.push(track);
    if (album.year == null) {
      album.year = track.year;
    }
  }

  this.dirtyAlbumTable = false;

  function createAlbum() {
    var album = {
      name: track.albumName,
      year: track.year,
      trackList: [],
      key: albumKey,
    };
    thisAlbumList.push(album);
    return album;
  }
};

MusicLibraryIndex.prototype.rebuild = function() {
  if (!this.dirty) return;
  this.rebuildAlbumTable();
  this.albumList.sort(this.albumComparator);

  var albumArtistName, artistKey, artist;
  var albumKey, track, album;
  var i;
  for (albumKey in this.albumTable) {
    album = this.albumTable[albumKey];
    var albumArtistSet = {};
    album.trackList.sort(this.trackComparator);
    albumArtistName = "";
    var isCompilation = false;
    for (i = 0; i < album.trackList.length; i += 1) {
      track = album.trackList[i];
      track.index = i;
      if (track.albumArtistName) {
        albumArtistName = track.albumArtistName;
        albumArtistSet[this.getArtistKey(albumArtistName)] = true;
      }
      if (!albumArtistName) albumArtistName = track.artistName;
      albumArtistSet[this.getArtistKey(albumArtistName)] = true;
      isCompilation = isCompilation || track.compilation;
    }
    if (isCompilation || moreThanOneKey(albumArtistSet)) {
      albumArtistName = this.variousArtistsName;
      artistKey = this.variousArtistsKey;
      for (i = 0; i < album.trackList.length; i += 1) {
        track = album.trackList[i];
        track.compilation = true;
      }
    } else {
      artistKey = this.getArtistKey(albumArtistName);
    }
    artist = getOrCreate(artistKey, this.artistTable, createArtist);
    album.artist = artist;
    artist.albumList.push(album);
  }

  this.artistList = [];
  var variousArtist = null;
  for (artistKey in this.artistTable) {
    artist = this.artistTable[artistKey];
    artist.albumList.sort(this.albumComparator);
    for (i = 0; i < artist.albumList.length; i += 1) {
      album = artist.albumList[i];
      album.index = i;
    }
    if (artist.key === this.variousArtistsKey) {
      variousArtist = artist;
    } else {
      this.artistList.push(artist);
    }
  }
  this.artistList.sort(this.artistComparator);
  if (variousArtist) {
    this.artistList.unshift(variousArtist);
  }
  for (i = 0; i < this.artistList.length; i += 1) {
    artist = this.artistList[i];
    artist.index = i;
  }

  this.dirty = false;

  function createArtist() {
    return {
      name: albumArtistName,
      albumList: [],
      key: artistKey,
    };
  }
}

MusicLibraryIndex.prototype.addTrack = function(track) {
  var oldTrack = this.trackTable[track.key];
  this.dirty = this.dirty ||
      oldTrack == null ||
      oldTrack.artistName !== track.artistName ||
      oldTrack.albumArtistName !== track.albumArtistName ||
      oldTrack.albumName !== track.albumName ||
      oldTrack.track !== track.track ||
      oldTrack.disc !== track.disc ||
      oldTrack.year !== track.year;
  this.dirtyAlbumTable = this.dirty;
  this.trackTable[track.key] = track;
}

MusicLibraryIndex.prototype.removeTrack = function(key) {
  delete this.trackTable[key];
  this.dirty = true;
  this.dirtyAlbumTable = true;
}

MusicLibraryIndex.prototype.search = function(query) {
  var searchResults = new MusicLibraryIndex({
    searchFields: this.searchFields,
    variousArtistsKey: this.variousArtistsKey,
    variousArtistsName: this.variousArtistsName,
    prefixesToStrip: this.prefixesToStrip,
  });

  var matcher = parseQuery(query);

  var track;
  for (var trackKey in this.trackTable) {
    track = this.trackTable[trackKey];
    if (matcher(track)) {
      searchResults.trackTable[track.key] = track;
    }
  }
  searchResults.dirty = true;
  searchResults.dirtyAlbumTable = true;
  searchResults.rebuild();

  return searchResults;

};

function makeFuzzyTextMatcher(term) {
  fuzzyTextMatcher.term = formatSearchable(term);;
  fuzzyTextMatcher.toString = function() {
    return "(fuzzy " + JSON.stringify(fuzzyTextMatcher.term) + ")"
  };
  return fuzzyTextMatcher;
  function fuzzyTextMatcher(track) {
    return track.fuzzySearchTags.indexOf(fuzzyTextMatcher.term) !== -1;
  }
}
function makeExactTextMatcher(term) {
  exactTextMatcher.toString = function() {
    return "(exact " + JSON.stringify(term) + ")"
  };
  return exactTextMatcher;
  function exactTextMatcher(track) {
    return track.exactSearchTags.indexOf(term) !== -1;
  }
}
function makeAndMatcher(children) {
  if (children.length === 1) return children[0];
  andMatcher.toString = function() {
    return "(" + children.join(" AND ") + ")";
  };
  return andMatcher;
  function andMatcher(track) {
    for (var i = 0; i < children.length; i++) {
      if (!children[i](track)) return false;
    }
    return true;
  }
}

var tokenizerRegex = new RegExp(
  '( +)'                        +'|'+ // 1: whitespace between terms (not in quotes)
  '(\\()'                       +'|'+ // 2: open parenthesis at the start of a term
  '(\\))'                       +'|'+ // 3: end parenthesis
  '("(?:[^"\\\\]|\\\\.)*"\\)*)' +'|'+ // 4: quoted thing. can end with parentheses
  '([^ ]+)',                          // 5: normal word. can end with parentheses
  "g");
var WHITESPACE = 1;
var OPEN_PARENTHESIS = 2;
var CLOSE_PARENTHESIS = 3;
var QUOTED_THING = 4;
var NORMAL_WORD = 5;
function tokenizeQuery(query) {
  tokenizerRegex.lastIndex = 0;
  var tokens = [];
  while (true) {
    var match = tokenizerRegex.exec(query);
    if (match == null) break;
    var term = match[0];
    var type;
    for (var i = 1; i < match.length; i++) {
      if (match[i] != null) {
        type = i;
        break;
      }
    }
    switch (type) {
      case WHITESPACE:
      case OPEN_PARENTHESIS:
      case CLOSE_PARENTHESIS:
        tokens.push({type: type, text: term});
        break;
      case QUOTED_THING:
      case NORMAL_WORD:
        var endParensCount = /\)*$/.exec(term)[0].length;
        term = term.substr(0, term.length - endParensCount);
        if (type === QUOTED_THING) {
          // strip quotes
          term = /^"(.*)"$/.exec(term)[1];
          // handle escapes
          term = term.replace(/\\(.)/g, "$1");
        }
        tokens.push({type: type, text: term});
        for (var i = 0; i < endParensCount; i++) {
          tokens.push({type: CLOSE_PARENTHESIS, text: ")"});
        }
        break;
    }
  }
  return tokens;
}
function parseQuery(query) {
  var tokens = tokenizeQuery(query);
  var tokenIndex = 0;
  return parseAnd(null);

  function parseAnd(waitForTokenType) {
    var matchers = [];
    var justSawWhitespace = true;
    while (tokenIndex < tokens.length) {
      var token = tokens[tokenIndex++];
      switch (token.type) {
        case OPEN_PARENTHESIS:
          var subMatcher = parseAnd(CLOSE_PARENTHESIS);
          matchers.push(subMatcher);
          break;
        case CLOSE_PARENTHESIS:
          if (waitForTokenType === CLOSE_PARENTHESIS) return makeAndMatcher(matchers);
          // misplaced )
          if (!justSawWhitespace && tokens[tokenIndex - 2].type == NORMAL_WORD) {
            // slap it on the back of the last guy
            matchers[matchers.length - 1].term += token.text;
          } else {
            // it's its own term
            matchers.push(makeFuzzyTextMatcher(token.text));
          }
          break;
        case QUOTED_THING:
          matchers.push(makeExactTextMatcher(token.text));
          break;
        case NORMAL_WORD:
          matchers.push(makeFuzzyTextMatcher(token.text));
          break;
      }
      var justSawWhitespace = token.type === WHITESPACE;
    }
    return makeAndMatcher(matchers);
  }
}

function getOrCreate(key, table, initObjFunc) {
  var result = table[key];
  if (result == null) {
    result = initObjFunc();
    table[key] = result;
  }
  return result;
}

function moreThanOneKey(object){
  var count = -2;
  for (var k in object) {
    if (!++count) {
      return true;
    }
  }
  return false;
}

function formatSearchable(str) {
  return removeDiacritics(str).toLowerCase();
}
