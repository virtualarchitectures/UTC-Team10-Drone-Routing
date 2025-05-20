import * as Cesium from "cesium"
import { init3dGoogleViewer } from "../../cesium-init.js"
import { initReadMe } from "../readme.js"
import { computeRoutes } from "../../api/routesapi.js"
import readme from "./README.md"

const { viewer } = await init3dGoogleViewer()
initReadMe(readme)

// *********** GLOBAL VARIABLES **********************
let originPin
let destinationPin
let routePolylines = []
var scene = viewer.scene
var canvas = viewer.canvas
let handler

const pinBuilder = new Cesium.PinBuilder()

// *********** UI FUNCTIONS **********************
export const reset = () => {
  originPin = undefined
  destinationPin = undefined
  viewer.entities.removeAll()
  handler?.destroy()
}

async function get_route(originPin, destinationPin) {
  const origin = coordinatesFromPin(originPin)
  const destination = coordinatesFromPin(destinationPin)

  try {
    const { routes } = await computeRoutes(origin, destination)
    drawPolyline(routes, origin, destination)
  } catch (error) {
    console.error("Error fetching route:", error.message)
  }
}

// *********** MAP DRAWING FUNCTIONS **********************

export const set_origin_destination = (isOrigin) => {
  const handler = new Cesium.ScreenSpaceEventHandler(canvas)
  handler.setInputAction(function (movement) {
    var feature = scene.pick(movement.position)
    if (Cesium.defined(feature) && scene.pickPositionSupported) {
      var cartesian = scene.pickPosition(movement.position)
      var cartographic = Cesium.Cartographic.fromCartesian(cartesian)
      const pin = viewer.entities.add({
        name: isOrigin ? "Origin" : "Destination",
        description: `Cartesian Coordiantes: ${cartographic}`,
        position: cartesian,
        billboard: {
          image: pinBuilder.fromText(isOrigin ? "O" : "D", Cesium.Color.GREEN, 48),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        }
      })

      // Make sure there is only one pin of each type.
      if (isOrigin) {
        if (originPin) {
          viewer.entities.remove(originPin)
        }
        originPin = pin
      } else {
        if (destinationPin) {
          viewer.entities.remove(destinationPin)
        }
        destinationPin = pin
      }

      if (originPin && destinationPin) {
        get_route(originPin, destinationPin)
      }

      // Stop listening for mouse clicks
      handler.destroy()
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

function drawPolyline(routes, origin, destination) {
  // Remove old routes
  routePolylines.forEach(function (element) {
    viewer.entities.remove(element)
  })

  routes.forEach(function (route) {
    const coordinates = route.polyline.geoJsonLinestring["coordinates"].flat()
    console.log(`Drawing polyline with ${coordinates.length} points`)
    const length_km = route["distanceMeters"] / 1000
    const duration_hr = parseInt(route["duration"].slice(0, -1)) / 3600
    const avg_speed_kmh = length_km / duration_hr
    const fuelConsumption_liters = route["travelAdvisory"]["fuelConsumptionMicroliters"] / 1000000

    const label = route["routeLabels"].join(" & ")
    const color = route["routeLabels"].includes("FUEL_EFFICIENT")
      ? Cesium.Color.GREEN.withAlpha(0.5)
      : Cesium.Color.RED.withAlpha(0.5)
    const warnings = route["warnings"]?.join(" ") || ""

    const routePolyline = viewer.entities.add({
      name: label,
      description: `
            Origin (lat, long): ${origin.latitude.toFixed(2)}, ${origin.longitude.toFixed(2)}<br>
            Destination (lat, long): ${destination.latitude.toFixed(2)}, ${destination.longitude.toFixed(2)}<br>
            Length (km): ${length_km.toFixed(2)}<br>
            Duration (hours): ${duration_hr.toFixed(2)}<br>
            Average Speed (kph): ${avg_speed_kmh.toFixed(2)}<br>
            Fuel Consumption for Gasoline Vehicle (liters): ${fuelConsumption_liters.toFixed(2)}<br>
            Warnings: ${warnings}<br>
          `,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(coordinates),
        material: color,
        width: 5,
        clampToGround: true
      }
    })
    routePolylines.push(routePolyline)
  })
  viewer.zoomTo(routePolylines)
}

function coordinatesFromPin(pin) {
  const cartesian = pin.position?.getValue()
  if (cartesian) {
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
    const lat = Cesium.Math.toDegrees(cartographic.latitude)
    const long = Cesium.Math.toDegrees(cartographic.longitude)
    //const altitiude = cartographic.height;
    return { latitude: lat, longitude: long }
  }
  // TODO: Pins can be defined different ways.
  // To make this a more general function, handle case where
  // pin coordinates are already lat/long coordinates
}
