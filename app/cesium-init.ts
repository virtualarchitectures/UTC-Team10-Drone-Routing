import axios from "axios"
import * as Cesium from "cesium"

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN
Cesium.RequestScheduler.requestsByServer["tile.googleapis.com:443"] = 18

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export const init3dGoogleViewer = async () => {
  // **************** MAP INITIALIZATION ***************************************

  // Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
  // NOTE: baseLayerPicker on the viewer must be false, and a Google 2D or 3D map must be used.
  // Google API results can only be shared on Google maps due to terms of service
  const viewer = new Cesium.Viewer("cesiumContainer", {
    // The globe does not need to be displayed,
    // since the Photorealistic 3D Tiles include terrain
    globe: false,
    // can turn timeline and animation back on if dealing with time-dependent data
    timeline: false,
    animation: false,
    // baseLayerPicker must be false to comply with Google API terms of service
    baseLayerPicker: false,
    // sceneModePicker is extra clutter, not really needed
    sceneModePicker: false,
    // geocoder must be Google for photorealistic tiles
    geocoder: Cesium.IonGeocodeProviderType.GOOGLE
  })

  const tileset = await Cesium.createGooglePhotorealistic3DTileset({
    // Only the Google Geocoder can be used with Google Photorealistic 3D Tiles.
    // Set the `geocoder` property of the viewer constructor options to IonGeocodeProviderType.GOOGLE.
    onlyUsingWithGoogleGeocoder: true
  })

  // Load the Google Photorealistic 3D tileset as the basemap
  try {
    viewer.scene.primitives.add(tileset)
  } catch (error) {
    console.log(`Failed to load tileset: ${error}`)
  }

  return {
    viewer,
    tileset
  }
}

export const init2dGoogleViewer = async () => {
  // Obtain a session token for the Google Maps API
  const response = axios.post(`https://tile.googleapis.com/v1/createSession?key=${GOOGLE_MAPS_API_KEY}`, {
    mapType: "satellite",
    language: "en-US",
    region: "US"
  })
  const sessionToken = (await response).data.session

  const google2dTileProvider = new Cesium.WebMapTileServiceImageryProvider({
    url: `https://tile.googleapis.com/v1/2dtiles/{TileMatrix}/{TileCol}/{TileRow}?session=${sessionToken}&key=${GOOGLE_MAPS_API_KEY}`,
    layer: "Google_Maps_2D",
    style: "default",
    format: "image/png",
    tileMatrixSetID: "",
    maximumLevel: 19,
    credit: new Cesium.Credit("Google")
  })

  // **************** MAP INITIALIZATION ***************************************
  // Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
  // NOTE: baseLayerPicker on the viewer must be false, and a Google 2D or 3D map must be used.
  // Google API results can only be shared on Google maps due to terms of service
  const viewer = new Cesium.Viewer("cesiumContainer", {
    // can turn timeline and animation back on if dealing with time-dependent data
    timeline: false,
    animation: false,
    baseLayer: new Cesium.ImageryLayer(google2dTileProvider),
    // baseLayerPicker must be false to comply with Google API terms of service
    baseLayerPicker: false,
    // sceneModePicker is extra clutter, not really needed
    sceneModePicker: false,
    // geocoder must be Google for photorealistic tiles
    geocoder: Cesium.IonGeocodeProviderType.GOOGLE
  })

  // Add accreditation for Google Maps API, do not remove
  const credit = new Cesium.Credit(
    `<img style="vertical-align:-5px" src="https://assets.ion.cesium.com/google-credit.png" alt="Google">`,
    true
  )
  viewer.creditDisplay.addStaticCredit(credit)

  return {
    viewer
  }
}
