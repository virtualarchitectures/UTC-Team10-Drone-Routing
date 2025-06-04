import * as Cesium from "cesium"
import { init3dGoogleViewer } from "../cesium-init"
import { searchNearby } from "../api/placesapi"

import flightData from "./formatted_routes/over_water.json"
import flightDataDirect from "./formatted_routes/over_water_direct.json"

import { computeRoutes, ComputeRoutesResponse } from "../api/routesapi"

// *********** VIEWER **********************
// Option of 2d or 3d tileset
const { viewer } = await init3dGoogleViewer()

// Set viewer start location
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(-6.2603, 53.3498, 1000000), // longitude, latitude, height in meters
  orientation: {
    heading: 0.0,
    pitch: -Cesium.Math.PI_OVER_TWO, // Look straight down
    roll: 0.0
  }
});

const resource = await Cesium.IonResource.fromAssetId(3412943)
const airZones = await Cesium.GeoJsonDataSource.load(resource, {
  clampToGround: true,
  stroke: Cesium.Color.BLACK,
  strokeWidth: 2
})

// Search for nearby hospitals and schools in Dublin, Ireland
const response = await searchNearby({
  regionCode: "IE",
  includedTypes: ["hospital", "school"],
  locationRestriction: {
    circle: {
      center: {
        longitude: -6.2603, // Longitude for Dublin, Ireland
        latitude: 53.3498 // Latitude for Dublin, Ireland
      },
      radius: 8000 // Radius in meters
    }
  }
})

// const hospitals = response.places.filter((place) => place.primaryType === "hospital")

// Handle the drawning of routes on entity selection
// let lines: Cesium.Entity[] = []
// viewer.selectedEntityChanged.addEventListener((entity: Cesium.Entity) => {
//   if (hospitals.filter((place) => place.displayName.text === entity.name).length > 0) {
//     // Display a zone around the selected hospital

//     // Draw a line to hospitals in range
//     const selectedHospitalPosition = entity.position?.getValue()
//     if (selectedHospitalPosition) {
//       const hosInRange = hospitals.filter((hospital) => {
//         // Not completely accurate, as it would go directly through the Earth, but good enough for this example.
//         return (
//           Cesium.Cartesian3.distance(
//             selectedHospitalPosition,
//             Cesium.Cartesian3.fromDegrees(hospital.location.longitude, hospital.location.latitude)
//           ) < 2000
//         ) // 2km range
//       })

//       // Clear previous lines
//       lines.forEach((line) => {
//         viewer.entities.remove(line)
//       })

//       console.log(selectedHospitalPosition)

//       lines = hosInRange.map((hospital) => {
//         const linePoints = [
//           selectedHospitalPosition.clone(),
//           Cesium.Cartesian3.fromDegrees(hospital.location.longitude, hospital.location.latitude)
//         ].map((point) => {
//           return viewer.scene.clampToHeight(point)
//         })

//         const line = new Cesium.Entity({
//           polyline: {
//             positions: linePoints,
//             width: 2
//           }
//         })
//         viewer.entities.add(line)
//         return line
//       })
//     }
//   }
// })

let hospitalPins: Cesium.Entity[] = [];

async function displayResults(places) {
  if (!places.length) {
    console.log("No results")
    return
  }

  const pinBuilder = new Cesium.PinBuilder()

  // Store all pin promises
  const pinPromises = places.map(async (place) => {
    const lat = place.location?.latitude
    const long = place.location?.longitude

    const image = await pinBuilder.fromUrl(
      place.iconMaskBaseUri + ".svg", 
      Cesium.Color.fromCssColorString(place.iconBackgroundColor), 
      48
    )
    
    const pin = viewer.entities.add({
      name: place.displayName.text,
      description: `${place.formattedAddress}<br>
        Rating: ${place.rating}<br>
        ${place.primaryTypeDisplayName?.text ?? ""} 
      `,
      position: Cesium.Cartesian3.fromDegrees(long, lat),
      billboard: {
        image,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      },
      show: false  // Set initial visibility to false
    })
    
    return pin;
  })

  hospitalPins = await Promise.all(pinPromises);
}

if (response.places) {
  displayResults(response.places)
}

// Add new toggle function
export const toggleHospitals = () => {
  hospitalPins.forEach(pin => {
    pin.show = !pin.show;
  });
}

// *********** FUNCTIONS FOR UI **********************
let currentFlightData = flightData;

export const toggleFlightData = () => {
  currentFlightData = currentFlightData === flightData ? flightDataDirect : flightData;
  console.log(`Switched to ${currentFlightData === flightData ? "over water" : "over water direct"} route`);
}

export const showRoute = async () => {
  /* Initialize the viewer clock:
  Assume the radar samples are 30 seconds apart, and calculate the entire flight duration based on that assumption.
  Get the start and stop date times of the flight, where the start is the known flight departure time (converted from PST 
    to UTC) and the stop is the start plus the calculated duration. (Note that Cesium uses Julian dates. See 
    https://simple.wikipedia.org/wiki/Julian_day.)
  Initialize the viewer's clock by setting its start and stop to the flight start and stop times we just calculated. 
  Also, set the viewer's current time to the start time and take the user to that time. 
*/
  const timeStepInSeconds = 30
  const totalSeconds = timeStepInSeconds * (flightData.length - 1)
  const start = Cesium.JulianDate.fromIso8601("2020-03-09T23:10:00Z")
  const stop = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate())
  viewer.clock.startTime = start.clone()
  viewer.clock.stopTime = stop.clone()
  viewer.clock.currentTime = start.clone()

  viewer.timeline.zoomTo(start, stop)
  // Speed up the playback speed 50x.
  viewer.clock.multiplier = 10
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP
  // Start playing the scene.
  viewer.clock.shouldAnimate = true

  // The SampledPositionedProperty stores the position and timestamp for each sample along the radar sample series.
  const positionProperty = new Cesium.SampledPositionProperty()

  for (let i = 0; i < currentFlightData.length; i++) {
    const dataPoint = currentFlightData[i];
    // Declare the time for this individual sample and store it in a new JulianDate instance.
    const time = Cesium.JulianDate.addSeconds(start, i * timeStepInSeconds, new Cesium.JulianDate())
    const position = Cesium.Cartesian3.fromDegrees(dataPoint.longitude, dataPoint.latitude, dataPoint.height + 30)
    // Store the position along with its timestamp.
    // Here we add the positions all upfront, but these can be added at run-time as samples are received from a server.
    positionProperty.addSample(time, position)

    // Show the sample points on the map
    viewer.entities.add({
      description: `Location: (${dataPoint.longitude}, ${dataPoint.latitude}, ${dataPoint.height})`,
      position: position,
      point: { pixelSize: 10, color: Cesium.Color.BLUE, heightReference: Cesium.HeightReference.RELATIVE_TO_TERRAIN }
    })
  }

  // Add drone resource
  const airplaneUri = await Cesium.IonResource.fromAssetId(3414234)
  const airplaneEntity = viewer.entities.add({
    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({ start: start, stop: stop })]),
    position: positionProperty,
    // Attach the 3D model instead of the green point.
    model: {
      uri: airplaneUri,
      heightReference: Cesium.HeightReference.RELATIVE_TO_TERRAIN,
      scale: 15,
      color: Cesium.Color.BLUE,
      colorBlendMode: Cesium.ColorBlendMode.MIX
    },
    // Automatically compute the orientation from the position.
    orientation: new Cesium.VelocityOrientationProperty(positionProperty)
    // path: new Cesium.PathGraphics({ width: 3, material: Cesium.Color.BLUE })
  })

  viewer.trackedEntity = airplaneEntity

  const origin = currentFlightData[0];
  const destination = currentFlightData[currentFlightData.length - 1];


  const distance = flightData.reduce((prev, curr, indx) => {
    if (indx === 0) {
      // Skip the first iteration
      return prev
    }

    const prevPoint = flightData[indx - 1]
    const currPoint = curr

    const distance = new Cesium.EllipsoidGeodesic(
      Cesium.Cartographic.fromDegrees(prevPoint.longitude, prevPoint.latitude),
      Cesium.Cartographic.fromDegrees(currPoint.longitude, currPoint.latitude)
    ).surfaceDistance

    return prev + distance
  }, 0)

  // const distance = new Cesium.EllipsoidGeodesic(
  //   Cesium.Cartographic.fromDegrees(origin.longitude, origin.latitude),
  //   Cesium.Cartographic.fromDegrees(destination.longitude, destination.latitude)
  // )

  const distanceElement = document.getElementById("distance-val")

  const distanceInKm = distance / 1000

  if (distanceElement) {
    distanceElement.textContent = `Distance: ${distanceInKm.toFixed(2)} km Duration:  ${(
      (distanceInKm / 50) *
      60
    ).toFixed(2)} mins`
  }

  const roadRoute = await computeRoutes(
    { longitude: origin.longitude, latitude: origin.latitude },
    {
      longitude: destination.longitude,
      latitude: destination.latitude
    }
  );

  showRoadRoute(roadRoute);
}

export const showAirZones = () => {
  if (viewer.dataSources.contains(airZones)) {
    viewer.dataSources.remove(airZones, false)
  } else {
    airZones.entities.values.forEach((entity) => {
      if (entity.polygon) {
        const lowerlimit = entity.properties?.getValue()["lowerlimit"] as number
        const upperlimit = entity.properties?.getValue()["upperlimit"] as number

        if (lowerlimit === 0) {
          entity.polygon.material = Cesium.Color.RED.withAlpha(0.5) as any
        } else if (lowerlimit <= 30) {
          entity.polygon.material = Cesium.Color.YELLOW.withAlpha(0.5) as any
        } else {
          entity.polygon.material = Cesium.Color.GREEN.withAlpha(0.5) as any
        }

        // Adds height and extruded height to the air zone polygons
        entity.polygon.extrudedHeight = upperlimit as any
        entity.polygon.perPositionHeight = false as any
        entity.polygon.height = lowerlimit as any
        entity.polygon.heightReference = Cesium.HeightReference.RELATIVE_TO_TERRAIN as any
        entity.polygon.extrudedHeight = upperlimit as any
        entity.polygon.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_TERRAIN as any
      }
    })

    viewer.dataSources.add(airZones)
  }
}

const showRoadRoute = (roadRoute: ComputeRoutesResponse) => {
  drawRoutes(roadRoute.routes)
}

const routePolylines: Cesium.Entity[] = []

function drawRoutes(routes: ComputeRoutesResponse["routes"]) {
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

    const warnings = route["warnings"]?.join(" ") || ""

    const routePolyline = viewer.entities.add({
      name: label,
      description: `
            Length (km): ${length_km.toFixed(2)}<br>
            Duration (mins): ${(duration_hr * 60).toFixed(2)}<br>
            Average Speed (kph): ${avg_speed_kmh.toFixed(2)}<br>
            Fuel Consumption for Gasoline Vehicle (liters): ${fuelConsumption_liters.toFixed(2)}<br>
            Warnings: ${warnings}<br>
          `,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(coordinates),
        material: Cesium.Color.RED.withAlpha(0.6),
        width: 8, // Set width of routes
        clampToGround: true
      }
    })
    routePolylines.push(routePolyline)
  })
}

