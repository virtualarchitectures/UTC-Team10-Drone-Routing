import * as Cesium from "cesium"
import { init3dGoogleViewer } from "../../cesium-init.js"
import { initReadMe } from "../readme.js"
import readme from "./README.md"

Cesium.ITwinPlatform.defaultShareKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpVHdpbklkIjoiMDRiYTcyNWYtZjNjMC00ZjMwLTgwMTQtYTQ0ODhjYmQ2MTJkIiwiaWQiOiJkNzNhODQzMC1iZWNiLTQxMTQtYThjYy04NmIxZGMzNGYzMjUiLCJleHAiOjE3NzcwNTU3Njl9.ySsHT7VcVZDTPBhrnzqRIQMaLwjD6p3mPyGCHUI0awA"

const { viewer } = await init3dGoogleViewer()
initReadMe(readme)

export const showITwin = async () => {
  const iTwinId = "535a24a3-9b29-4e23-bb5d-9cedb524c743"
  const surroundingArea = addTilesetFromIModelId("f856f57d-3d28-4265-9c4f-5e60c0662c15")
  const station = addTilesetFromIModelId("669dde67-eb69-4e0b-bcf2-f722eee94746")
  const realityMesh = addRealityMesh(iTwinId, "85897090-3bcc-470b-bec7-20bb639cc1b9")
  const birdsEyeView = {
    destination: new Cesium.Cartesian3(1255923.367096007, -4734564.543879414, 4072623.4624344883),
    orientation: new Cesium.HeadingPitchRoll(6.283185307179586, -0.5002442676148875, 6.283185307179586),
    duration: 0,
    easingFunction: Cesium.EasingFunction.LINEAR_NONE
  }
  viewer.scene.camera.flyTo(birdsEyeView)
}

async function addTilesetFromIModelId(iModelId) {
  const iModelTileset = await Cesium.ITwinData.createTilesetFromIModelId(iModelId)

  if (iModelTileset) {
    // Change how highlighting with the feature selection changes the color
    iModelTileset.colorBlendMode = Cesium.Cesium3DTileColorBlendMode.REPLACE
    // Add the tilesets to the viewer
    viewer.scene.primitives.add(iModelTileset)
  }
  return iModelTileset
}

async function addRealityMesh(iTwinId, realityMeshId) {
  const realityMesh = await Cesium.ITwinData.createTilesetForRealityDataId(iTwinId, realityMeshId)
  viewer.scene.primitives.add(realityMesh)
  return realityMesh
}

// HTML overlay for showing feature name on mouseover
const nameOverlay = document.createElement("div")
viewer.container.appendChild(nameOverlay)
nameOverlay.className = "backdrop"
nameOverlay.style.display = "none"
nameOverlay.style.position = "absolute"
nameOverlay.style.bottom = "0"
nameOverlay.style.left = "0"
nameOverlay.style["pointer-events"] = "none"
nameOverlay.style.padding = "4px"
nameOverlay.style.backgroundColor = "black"
nameOverlay.style.whiteSpace = "pre-line"
nameOverlay.style.fontSize = "12px"
nameOverlay.style.color = "white"

let selectedFeature

const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
handler.setInputAction(function (movement) {
  unselectFeature(selectedFeature)

  const feature = viewer.scene.pick(movement.endPosition)

  if (feature instanceof Cesium.Cesium3DTileFeature) {
    selectFeature(feature, movement)
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

function selectFeature(feature, movement) {
  feature.color = Cesium.Color.clone(Cesium.Color.fromCssColorString("#eeff41"), feature.color)
  selectedFeature = feature

  nameOverlay.style.display = "block"
  nameOverlay.style.bottom = `${viewer.canvas.clientHeight - movement.endPosition.y}px`
  nameOverlay.style.left = `${movement.endPosition.x}px`
  const element = feature.getProperty("element")
  const subcategory = feature.getProperty("subcategory")
  const message = `Element ID: ${element}
      Subcategory: ${subcategory}
      Feature ID: ${feature.featureId}`
  nameOverlay.textContent = message
}

function unselectFeature(feature) {
  if (!Cesium.defined(feature)) {
    return
  }

  feature.color = Cesium.Color.clone(Cesium.Color.WHITE, feature.color)
  selectedFeature = undefined
  nameOverlay.style.display = "none"
}
