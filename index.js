var removeDiacritics = require('diacritics').remove;

module.exports = MusicLibraryIndex;

MusicLibraryIndex.defaultPrefixesToStrip = [/^\s*the\s+/, /^\s*a\s+/,
  /^\s*an\s+/];
MusicLibraryIndex.defaultVariousArtistsKey = "VariousArtists";
MusicLibraryIndex.defaultVariousArtistsName = "Various Artists";
MusicLibraryIndex.defaultSearchFields = ['artistName', 'albumArtistName',
  'albumName', 'name'];

function MusicLibraryIndex(options) {
  options = options || {};
  this.searchFields = options.searchFields ||
    MusicLibraryIndex.defaultSearchFields;
  this.variousArtistsKey = options.variousArtistsKey ||
    MusicLibraryIndex.defaultVariousArtistsKey;
  this.variousArtistsName = options.variousArtistsName ||
    MusicLibraryIndex.defaultVariousArtistsName;
  this.prefixesToStrip = options.prefixesToStrip ||
    MusicLibraryIndex.defaultPrefixesToStrip;

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
  if (a.track < b.track) {
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
};

MusicLibraryIndex.prototype.rebuild = function() {
  if (!this.dirty) return;
  // builds everything from trackTable
  this.artistTable = {};
  this.artistList = [];
  this.albumTable = {};
  this.albumList = [];
  var thisAlbumList = this.albumList;
  var albumKey, album, trackKey, track;
  var i;
  for (trackKey in this.trackTable) {
    track = this.trackTable[trackKey];
    this.trackTable[track.key] = track;

    var searchTags = "";
    for (i = 0; i < this.searchFields.length; i += 1) {
      searchTags += track[this.searchFields[i]] + "\n";
    }
    track.searchTags = formatSearchable(searchTags);

    track.albumArtistName = track.albumArtistName || "";

    albumKey = this.getAlbumKey(track);
    album = getOrCreate(albumKey, this.albumTable, createAlbum);
    track.album = album;
    album.trackList.push(track);
    if (album.year == null) {
      album.year = track.year;
    }
  }
  this.albumList.sort(this.albumComparator);

  var albumArtistName, artistKey, artist;
  for (albumKey in this.albumTable) {
    album = this.albumTable[albumKey];
    var albumArtistSet = {};
    album.trackList.sort(this.trackComparator);
    albumArtistName = "";
    for (i = 0; i < album.trackList.length; i += 1) {
      track = album.trackList[i];
      track.index = i;
      if (track.albumArtistName) {
        albumArtistName = track.albumArtistName;
        albumArtistSet[this.getArtistKey(albumArtistName)] = true;
      }
      albumArtistSet[this.getArtistKey(track.artistName)] = true;
    }
    if (moreThanOneKey(albumArtistSet)) {
      albumArtistName = this.variousArtistsName;
      artistKey = this.variousArtistsKey;
      for (i = 0; i < album.trackList.length; i += 1) {
        track = album.trackList[i];
        track.compilation = true;
        track.albumArtistName = this.variousArtistsName;
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
    this.artistList.splice(0, 0, variousArtist);
  }
  for (i = 0; i < this.artistList.length; i += 1) {
    artist = this.artistList[i];
    artist.index = i;
  }

  this.dirty = false;

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

  function createArtist() {
    return {
      name: albumArtistName,
      albumList: [],
      key: artistKey,
    };
  }
}

MusicLibraryIndex.prototype.addTrack = function(track) {
  this.trackTable[track.key] = track;
  this.dirty = true;
}

MusicLibraryIndex.prototype.removeTrack = function(key) {
  delete this.trackTable[key];
  this.dirty = true;
}

MusicLibraryIndex.prototype.search = function(query) {
  query = query.trim();

  if (query.length === 0) return this;

  var searchResults = new MusicLibraryIndex({
    searchFields: this.searchFields,
    variousArtistsKey: this.variousArtistsKey,
    variousArtistsName: this.variousArtistsName,
    prefixesToStrip: this.prefixesToStrip,
  });

  var words = formatSearchable(query).split(/\s+/);

  var track;
  for (var trackKey in this.trackTable) {
    track = this.trackTable[trackKey];
    if (testMatch()) {
      searchResults.addTrack(track);
    }
  }
  searchResults.rebuild();

  return searchResults;

  function testMatch() {
    for (var i = 0; i < words.length; i += 1) {
      var word = words[i];
      if (track.searchTags.indexOf(word) === -1) {
        return false;
      }
    }
    return true;
  }
};

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
