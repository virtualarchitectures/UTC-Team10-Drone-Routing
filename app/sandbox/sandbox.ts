import * as Cesium from "cesium"
import { init3dGoogleViewer } from "../cesium-init"
import { searchNearby } from "../api/placesapi"
import flightData from "./formatted_routes/0_11_Mater_Misericordiae_to_Rotunda_Hospital.json"

// *********** VIEWER **********************
// Option of 2d or 3d tileset
const { viewer } = await init3dGoogleViewer()

const resource = await Cesium.IonResource.fromAssetId(3412943)
const dataSource = await Cesium.GeoJsonDataSource.load(resource, {
  clampToGround: true,
  stroke: Cesium.Color.BLACK,
  strokeWidth: 2
})

dataSource.entities.values.forEach((entity) => {
  if (entity.polygon) {
    console.log(entity.properties)
    const lowerlimit = entity.properties?.getValue()["lowerlimit"] as number
    const upperlimit = entity.properties?.getValue()["upperlimit"] as number
    console.log(entity.properties?.getValue())

    if (lowerlimit === 0) {
      entity.polygon.material = Cesium.Color.RED.withAlpha(0.4) as any
    } else if (lowerlimit <= 30) {
      entity.polygon.material = Cesium.Color.YELLOW.withAlpha(0.4) as any
    } else {
      entity.polygon.material = Cesium.Color.GREEN.withAlpha(0.4) as any
    }

    // entity.s

    // entity.polygon.extrudedHeight = upperlimit as any
    // entity.polygon.perPositionHeight = false as any
    // entity.polygon.height = lowerlimit as any
    // entity.polygon.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND as any
    // entity.polygon.extrudedHeight = upperlimit as any
    // entity.polygon.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND as any
  }
})

viewer.dataSources.add(dataSource)

// for (let i = 0; i < flightData.length; i++) {
//   const dataPoint = flightData[i]

//   viewer.entities.add({
//     description: `Location: (${dataPoint.longitude}, ${dataPoint.latitude}, ${dataPoint.height})`,
//     position: Cesium.Cartesian3.fromDegrees(dataPoint.longitude, dataPoint.latitude, dataPoint.height),

//     point: { pixelSize: 10, color: Cesium.Color.RED, heightReference: Cesium.HeightReference.RELATIVE_TO_3D_TILE }
//   })
// }

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

const hospitals = response.places.filter((place) => place.primaryType === "hospital")

// Handle the drawning of routes on entity selection
let lines: Cesium.Entity[] = []
viewer.selectedEntityChanged.addEventListener((entity: Cesium.Entity) => {
  if (hospitals.filter((place) => place.displayName.text === entity.name).length > 0) {
    // Display a zone around the selected hospital

    // Draw a line to hospitals in range
    const selectedHospitalPosition = entity.position?.getValue()
    if (selectedHospitalPosition) {
      const hosInRange = hospitals.filter((hospital) => {
        // Not completely accurate, as it would go directly through the Earth, but good enough for this example.
        return (
          Cesium.Cartesian3.distance(
            selectedHospitalPosition,
            Cesium.Cartesian3.fromDegrees(hospital.location.longitude, hospital.location.latitude)
          ) < 2000
        ) // 2km range
      })

      // Clear previous lines
      lines.forEach((line) => {
        viewer.entities.remove(line)
      })

      console.log(selectedHospitalPosition)

      lines = hosInRange.map((hospital) => {
        const linePoints = [
          selectedHospitalPosition.clone(),
          Cesium.Cartesian3.fromDegrees(hospital.location.longitude, hospital.location.latitude)
        ].map((point) => {
          return viewer.scene.clampToHeight(point)
        })

        const line = new Cesium.Entity({
          polyline: {
            positions: linePoints,
            width: 2
          }
        })
        viewer.entities.add(line)
        return line
      })
    }
  }
})

if (response.places) {
  displayResults(response.places)
}

async function displayResults(places) {
  // Use the places to draw several entities on the map.
  if (!places.length) {
    console.log("No results")
    return
  }

  // DRAW PINS
  const pinBuilder = new Cesium.PinBuilder()

  // Loop through and get all the results.
  places.map(async (place) => {
    const lat = place.location?.latitude
    const long = place.location?.longitude

    return Promise.resolve(
      pinBuilder.fromUrl(place.iconMaskBaseUri + ".svg", Cesium.Color.fromCssColorString(place.iconBackgroundColor), 48)
    ).then((image) => {
      // Note: the ? allows the  property to be missing for a particular place, and simply returns a blank string.
      return viewer.entities.add({
        name: place.displayName.text,
        description: `${place.formattedAddress}<br>
          Rating: ${place.rating}<br>
          ${place.primaryTypeDisplayName?.text ?? ""} 
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

  // viewer.camera.setView({
  //   destination: Cesium.Rectangle.fromCartesianArray([
  //     Cesium.Cartesian3.fromDegrees(-6.2757440952928505, 53.35566508381177),
  //     Cesium.Cartesian3.fromDegrees(-6.2757440952928505, 53.34217624248879),
  //     Cesium.Cartesian3.fromDegrees(-6.246062078659605, 53.34217624248879),
  //     Cesium.Cartesian3.fromDegrees(-6.246062078659605, 53.35566508381177)
  //   ])
  // })
}

// *********** FUNCTIONS FOR UI **********************
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
  viewer.clock.multiplier = 5
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP
  // Start playing the scene.
  viewer.clock.shouldAnimate = true

  // The SampledPositionedProperty stores the position and timestamp for each sample along the radar sample series.
  const positionProperty = new Cesium.SampledPositionProperty()

  for (let i = 0; i < flightData.length; i++) {
    const dataPoint = flightData[i]
    // Declare the time for this individual sample and store it in a new JulianDate instance.
    const time = Cesium.JulianDate.addSeconds(start, i * timeStepInSeconds, new Cesium.JulianDate())
    const position = Cesium.Cartesian3.fromDegrees(dataPoint.longitude, dataPoint.latitude, dataPoint.height)
    // Store the position along with its timestamp.
    // Here we add the positions all upfront, but these can be added at run-time as samples are received from a server.
    positionProperty.addSample(time, position)

    // Show the sample points on the map
    viewer.entities.add({
      description: `Location: (${dataPoint.longitude}, ${dataPoint.latitude}, ${dataPoint.height})`,
      position: position,
      point: { pixelSize: 10, color: Cesium.Color.RED, heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND }
    })
  }

  // Add drone resource
  const airplaneUri = await Cesium.IonResource.fromAssetId(3414234)
  const airplaneEntity = viewer.entities.add({
    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({ start: start, stop: stop })]),
    position: positionProperty,
    // Attach the 3D model instead of the green point.
    model: { uri: airplaneUri, heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND },
    // Automatically compute the orientation from the position.
    orientation: new Cesium.VelocityOrientationProperty(positionProperty),
    path: new Cesium.PathGraphics({ width: 3 })
  })

  viewer.trackedEntity = airplaneEntity
}
