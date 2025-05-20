
This page uses the Google Routes API to calculate the best travel route between an origin and a destination.

Click on the Origin button and select on the map to drop a pin. Then click the Destination button to drop another pin. As soon as both an Origin and Destination pin exist, the Google Routes API will be queried. 

The request returns both the fastest route and the most fuel efficient route, and both are drawn on the map if they are different. If you click on a route, a popup will give you more information, including whether it is the default route, the fuel efficient route, or both. It will also show the Origin and Destination coordinates, the length, duration, and average speed of the route, the approximate fuel consumption for a gas vehicle, and any warnings returned by the API.

If you click to add a new Origin or Destination, the route will automatically recalculate. The Reset button removes all pins and routes.

An unresolved issue is that the origin and destination pins are sometimes rendered partially or fully clipped by the terrain, so you may need to adjust the zoom and view angles to see them.