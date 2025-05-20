import * as Cesium from "cesium"
import { init2dGoogleViewer } from "../../cesium-init.js"
import { initReadMe } from "../readme"
import readme from "./README.md"

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

let showingAirQuality = false

// *********** VIEWER **********************
const { viewer } = await init2dGoogleViewer()
initReadMe(readme)

// *********** FUNCTIONS FOR UI **********************
export const showAirQuality = async () => {
  if (!showingAirQuality) {
    /**
     * Google Places API v1: lookupHeatmapTile
     * @see https://developers.google.com/maps/documentation/air-quality/reference/rest/v1/mapTypes.heatmapTiles/lookupHeatmapTile
     */
    const airQualityProvider = new Cesium.WebMapTileServiceImageryProvider({
      url: `https://airquality.googleapis.com/v1/mapTypes/US_AQI/heatmapTiles/{TileMatrix}/{TileCol}/{TileRow}?key=${GOOGLE_MAPS_API_KEY}`,
      layer: "Google_Air_Quality",
      style: "default",
      format: "image/png",
      tileMatrixSetID: "",
      maximumLevel: 19,
      credit: new Cesium.Credit("Google")
    })

    const imageLayer = await Cesium.ImageryLayer.fromProviderAsync(airQualityProvider, { alpha: 0.5 })
    viewer.imageryLayers.add(imageLayer)
    showingAirQuality = true
  }
}
