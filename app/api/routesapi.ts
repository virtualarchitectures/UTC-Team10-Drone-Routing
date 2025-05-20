import axios from "axios"

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

/**
 * Google Routes API v2
 * @see https://developers.google.com/maps/documentation/routes/reference/rest
 */
export interface LatLong {
  latitude: number
  longitude: number
}

export interface IComputeRoutesRequest {
  origin: {
    location: {
      latLng: LatLong
    }
  }
  destination: {
    location: {
      latLng: LatLong
    }
  }
  travelMode: string
  routingPreference: string
  computeAlternativeRoutes: boolean
  routeModifiers: {
    avoidTolls: boolean
    avoidHighways: boolean
    avoidFerries: boolean
    vehicleInfo: {
      emissionType: string
    }
  }
  extraComputations: string[]
  languageCode: string
  units: string
  polylineEncoding: string
  requestedReferenceRoutes: string[]
}

export interface Route {
  polyline: {
    geoJsonLinestring: object
  }
}

export interface ComputeRoutesResponse {
  routes: Route[]
}

/**
 * Compute Routes API v2
 * @see https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes
 */
export const computeRoutes = async (origin: LatLong, destination: LatLong) => {
  const request: IComputeRoutesRequest = {
    origin: {
      location: {
        latLng: origin
      }
    },
    destination: {
      location: {
        latLng: destination
      }
    },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE_OPTIMAL",
    computeAlternativeRoutes: false,
    routeModifiers: {
      avoidTolls: false,
      avoidHighways: false,
      avoidFerries: false,
      vehicleInfo: {
        emissionType: "GASOLINE"
      }
    },
    extraComputations: ["EXTRA_COMPUTATION_UNSPECIFIED"],
    languageCode: "en-US",
    units: "IMPERIAL",
    polylineEncoding: "GEO_JSON_LINESTRING",
    requestedReferenceRoutes: ["FUEL_EFFICIENT"]
  }
  return await axios
    .post("https://routes.googleapis.com/directions/v2:computeRoutes", request, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask":
        "routes.duration,routes.distanceMeters,routes.polyline,routes.routeLabels,routes.travelAdvisory,routes.warnings" // selected fields only
        //'X-Goog-FieldMask': '*', // see all available fields, add desired to FieldMask for production code
      }
    })
    .then((response) => {
      return response.data as ComputeRoutesResponse
    })
}
