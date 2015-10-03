# Music Library Index

Given track metadata objects, constructs a searchable object model.
This module is used both in the client and the server of
[Groove Basin](https://github.com/andrewrk/groovebasin).

## Features

 * Sort order ignores 'a', 'an' and 'the' in artists, albums, and names.
 * Sorting and searching is case insensitive and
   [diacritics-insensitive](https://github.com/andrewrk/diacritics).
 * Searching uses word-based filtering (this is how most music player
   applications implement filtering) on all track fields.
 * Distinguishes albums by name, date, and album artist.
 * Produces these indexes:
   * Artists in sorted order
     - For each of these artists, albums in sorted order.
       - For each of these albums, tracks in sorted order.
   * Albums in sorted order
     - For each of these albums, tracks in sorted order.
   * Tracks by user-defined key.
   * Artists by library-defined key.
   * Albums by library-defined key.
 * Searching allows the use of special constructs:
   * Quoted terms (`"..."`) exactly match every character, including spaces,
     upper- and lower-case letters, and characters with diacritics.
     Inside quotes, use `\"` for a literal quote and `\\` for a literal backslash.
   * Terms starting with `not:` match anything not matched by the rest of the term.
     For example `metal not:metalica` or `just not:"Justin Bieber"`.
   * Parentheses can be used to group terms. For example `tool not:(opiate live)`.

## Usage

```js
var MusicLibraryIndex = require('music-library-index');
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

library.rebuildTracks();

console.log(library.artistList[0]);
console.log(library.trackTable);
```

## Tests

```
  basic index building
    ✓ trackTable 
    ✓ artistList 
    ✓ albumList 
    ✓ searching 

  compilation album
    ✓ filed in various artists 

  tracks from same album missing year metadata
    ✓ still knows they're in the same album 

  different albums with same name
    ✓ detects that they are different 

  album with a few tracks by different artists
    ✓ only creates one album 

  album by an artist
    ✓ should be filed under the artist 

  album by an artist
    ✓ sorts by disc before track 

  album artist with no album
    ✓ shouldn't be various artists 

  unknown artist, unknown album
    ✓ should be put into the same album 
    ✓ searching should not affect anything 

  album with album artist
    ✓ shouldn't be various artists 
```
