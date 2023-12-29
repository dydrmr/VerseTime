# VerseTime
In-game times for Star Citizen landing zones.
Visit [this link](https://dydrmr.github.io/VerseTime/) to check it out.

## Interface
Your selected options are saved when you change them.
* To change your location, either click on the location name in the center of the window, or press <kbd>/</kbd> (slash) to open the window.
* Toggle between 12 and 24-hour time with <kbd>T</kbd>.
* Toggle the 3D map with <kbd>M</kbd>.
* Toggle the Astro Atlas with <kbd>A</kbd>.
* Toggle debug information with <kbd>D</kbd>.
* Close any open windows with <kbd>Esc</kbd>.

## Search functionality
Access search by clicking on the location name at the center of the screen or by pressing <kbd>/</kbd>.

You can filter locations in the search interface in a variety of ways:
* by location name: e.g. "Lorville".
* by celestial body: e.g. "Daymar".
* by current precise time: e.g. "12:00".
* by current day phase: valid queries are: "Night", "Twilight", "Starrise", "Morning", "Noon", "Afternoon", "Evening", "Starset", "Polar day", "Polar Night", "Permanent Day", and "Permanent Night".
* Combine queries using the **[ + ]** symbol: e.g. "Daymar+Afternoon" will return all locations on Daymar where the local time is in the afternoon.

Pressing <kbd>Enter</kbd> will switch to the first location in the filtered list.
Locations can be selected with the <kbd>Up</kbd> and <kbd>Down</kbd> arrow keys.

## Sharing
Click the "Share" button at the top center of the window. A URL pointing to your currently displayed location will be copied to your clipboard. You can share this URL with others or use it to bookmark your favorite locations for quick access.

## Credits
* Data sourced from in-game files which were collated by Murphy Exploration Group [in this Google Sheets file](https://docs.google.com/spreadsheets/d/1aGJ0_49ve1NKf0GvSteSt3-a4jSxnj2snHmTDwKTBgs/edit#gid=1238406064).
* Background images courtesy of the [starcitizen.tools Wiki](https://starcitizen.tools/Star_Citizen_Wiki).
* 3D map powered by [Three.js](https://threejs.org/).