import * as Cesium from "cesium"
import { init3dGoogleViewer } from "../../cesium-init.js"
import { initReadMe } from "../readme.js"
import readme from "./README.md"
import { client } from "../../itwin/auth.js"

// Authenticate with iTwin Platform
await client.signIn()
const accessToken = await client.getAccessToken()

Cesium.ITwinPlatform.defaultShareKey = undefined
Cesium.ITwinPlatform.defaultAccessToken = accessToken.substring(7)

const { viewer } = await init3dGoogleViewer()
initReadMe(readme)

export const showIModel = async (iModelId) => {
  // const iModelId = "0d20675e-b75e-4c19-9e19-501c9c89aab3"
  const iModelTiles = await Cesium.ITwinData.createTilesetFromIModelId(iModelId)

  console.log("iModelTiles", iModelTiles)

  if (iModelTiles) {
    // Add the tilesets to the viewer
    viewer.scene.primitives.add(iModelTiles)

    // Overlay the iTwin / iModel BIM Models
    const cartographic = Cesium.Cartographic.fromCartesian(iModelTiles.boundingSphere.center)
    const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0)
    const offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 40) //this is where we adjust the height of the model
    const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3())
    iModelTiles.modelMatrix = Cesium.Matrix4.fromTranslation(translation)

    const bs = iModelTiles.boundingSphere
    viewer.camera.flyToBoundingSphere(bs, { duration: 2 })
  }
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
