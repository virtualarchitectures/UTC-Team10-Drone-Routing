import axios from "axios"

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

/**
 * Google Places API v1
 * @see https://developers.google.com/maps/documentation/places/web-service/reference/rest
 */


export interface SearchTextRequest {
  textQuery: string
  maxResultCount: number
}

export interface Place {
  displayName: {
    text: string
  }
  location: {
    longitude: number
    latitude: number
  }
  formattedAddress: string
  primaryTypeDisplayName: {
    text: string
  }
  iconMaskBaseUri: string
  iconBackgroundColor: string
  rating: number
}

export interface SearchTextResponse {
  places: Place[]
}

/**
 * Google Places API v1: Search Text
 * @see https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/searchText
 */
export const searchText = async (request: SearchTextRequest) => {
  return await axios
    .post("https://places.googleapis.com/v1/places:searchText", request, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "places" // restrict returned fields to only those needed
      }
    })
    .then((response) => {
      console.log(response.data)
      return response.data as SearchTextResponse
    })
}
