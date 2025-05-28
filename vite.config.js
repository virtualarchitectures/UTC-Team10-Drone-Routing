import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import cesium from "vite-plugin-cesium"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    cesium(),
    {
      name: "md-loader",
      transform(code, id) {
        if (id.endsWith(".md")) {
          return `export default ${JSON.stringify(code)};`
        }
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        flood: resolve(__dirname, "./app/examples/flood/index.html")
      }
    }
  }
})
