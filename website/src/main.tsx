import React from "react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "./Homepage"
import { RootProvider } from "./components/RootContext"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootProvider>
      <App />
    </RootProvider>
  </StrictMode>
)
