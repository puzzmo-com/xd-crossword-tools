import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import { readFileSync } from "fs"
import { resolve } from "path"
import MarkdownIt from "markdown-it"

// Plugin to include README.md as a virtual module
function readmePlugin() {
  const virtualModuleID = "virtual:readme"
  const resolvedVirtualModuleID = "\0" + virtualModuleID

  return {
    name: "readme-plugin",
    resolveId(id: string) {
      if (id === virtualModuleID) {
        return resolvedVirtualModuleID
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleID) {
        try {
          // Read README.md from parent directory
          const readmePath = resolve(__dirname, "../README.md")
          const readmeContent = readFileSync(readmePath, "utf-8")

          // Convert markdown to HTML
          const md = new MarkdownIt({
            html: true,
            linkify: true,
            typographer: true,
          })
          const htmlContent = md.render(readmeContent)

          // Return as ES module
          return `export const readmeHtml = ${JSON.stringify(htmlContent)};`
        } catch (error) {
          console.error("Failed to read README.md:", error)
          return `export const readmeHtml = "<p>Failed to load README content</p>";`
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), readmePlugin()],
})
