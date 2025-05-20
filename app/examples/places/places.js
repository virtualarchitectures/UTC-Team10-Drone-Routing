// *********** SETUP **********************
// Perform inital setup and import useful functions and variables
import * as Cesium from "cesium"
import { init3dGoogleViewer } from "../../cesium-init.js"
import { initReadMe } from "../readme.js"
import { searchText } from "../../api/placesapi.js"
import readme from "./README.md"

// *********** GLOBAL VARIABLES **********************
let bounding_box = [999, 999, 999, -999, -999, -999, -999, 999]

const { viewer, tileset } = await init3dGoogleViewer()
initReadMe(readme)

// *********** FUNCTIONS FOR UI **********************

export const searchPlaces = async (query) => {
  // Clear any previous results.
  viewer.entities.removeAll()
  try {
    const response = await searchText({
      textQuery: query,
      maxResultCount: 20
    })
    if (response.places) {
      displayResults(response.places)
    }
  } catch (error) {
    alert("Error: " + error.message)
  }
}

export const changeClipState = (clip) => {
  if (clip) {
    // Clip the 3D tileset to the bounding box
    // With inverse true, this clips everything outside the boundary.
    const clippingPolygons = new Cesium.ClippingPolygonCollection({
      polygons: [
        new Cesium.ClippingPolygon({
          positions: Cesium.Cartesian3.fromDegreesArray(bounding_box)
        })
      ],
      inverse: true
    })

    // Add the clipping polygon collection to the global tileset
    tileset.clippingPolygons = clippingPolygons
  } else {
    // There's probably an easier way to clear the clipping polygons than setting a new empty collection
    const clippingPolygons = new Cesium.ClippingPolygonCollection({
      polygons: []
    })

    // Add the clipping polygon collection to the global tileset
    tileset.clippingPolygons = clippingPolygons
  }
}

// *********** MAP DRAWING FUNCTIONS **********************

async function displayResults(places) {
  // Use the places to draw several entities on the map.
  if (!places.length) {
    console.log("No results")
    return
  }

  // DRAW PINS
  const pinBuilder = new Cesium.PinBuilder()

  // Loop through and get all the results.
  const pins = places.map(async (place) => {
    const lat = place.location?.latitude
    const long = place.location?.longitude

    bounding_box = [
      Math.min(long, bounding_box[0]),
      Math.min(lat, bounding_box[1]),
      Math.min(long, bounding_box[2]),
      Math.max(lat, bounding_box[3]),
      Math.max(long, bounding_box[4]),
      Math.max(lat, bounding_box[5]),
      Math.max(long, bounding_box[6]),
      Math.min(lat, bounding_box[7])
    ]

    return Promise.resolve(
      pinBuilder.fromUrl(place.iconMaskBaseUri + ".svg", Cesium.Color.fromCssColorString(place.iconBackgroundColor), 48)
    ).then((image) => {
      // Note: the ? allows the  property to be missing for a particular place, and simply returns a blank string.
      return viewer.entities.add({
        name: place.displayName.text,
        description: `${place.formattedAddress}<br>
          Rating: ${place.rating}<br>
          ${place.primaryTypeDisplayName.text ?? ""} 
        `,
        position: Cesium.Cartesian3.fromDegrees(long, lat),
        billboard: {
          //image: pinBuilder.fromText(place['rating'], Cesium.Color.BLUE, 48).toDataURL(),
          image,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        }
      })
    })
  })

  //Since some of the pins may be created asynchronously depending on pinBuilder type, wait for them all to load before zooming/
  Promise.all(pins).then(function (pins) {
    viewer.zoomTo(pins)
  })
}
