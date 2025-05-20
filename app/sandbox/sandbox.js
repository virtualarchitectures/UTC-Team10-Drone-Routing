import * as Cesium from "cesium"
import { init2dGoogleViewer, init3dGoogleViewer } from "../cesium-init"

// *********** VIEWER **********************

// Option of 2d or 3d tileset
const { viewer } = await init3dGoogleViewer()
// const { viewer } = await init2dGoogleViewer()

// *********** FUNCTIONS FOR UI **********************
export const doSomething = async () => {}
