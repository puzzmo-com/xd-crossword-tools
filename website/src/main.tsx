import React from "react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "./App"
import { RootProvider } from "./RootContext"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootProvider>
      <App />
    </RootProvider>
  </StrictMode>
)
