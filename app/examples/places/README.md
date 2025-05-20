
This page uses the Google Places Text Search API to return a set of locations based on the user text in the search box. Example searches are "Restaraunts near Exton PA" or "Grocery Stores in Long Island" or "Hospitals near me". 

The pin icon and color are provided by the Google API response. Clickin a pin gives a popup with the location name, address, user rating, and type of business.

The Clip to Results checkbox will calculate a bounding box around all the current pins and clip the background map to remove everything outside of this box. This is just a demo of the clipping functionality. A more practical use case would be to draw a bounding box around an existing 3D building and set the 'inverse' property to false, clipping the building from the map and allowing space to draw a proposed structure from an iModel or other 3D asset.
