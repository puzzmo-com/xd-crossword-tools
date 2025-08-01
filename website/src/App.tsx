import React, { useState, useEffect } from "react"
import { Router, Route } from "wouter"
import { RootProvider } from "./components/RootContext"
import Homepage from "./Homepage"
import MassImport from "./MassImport"

// Hash-based routing for GitHub Pages compatibility
const useHashLocation = (): [string, (to: string) => void] => {
  const [location, setLocation] = useState(() => window.location.hash.slice(1) || "/")

  useEffect(() => {
    const handleHashChange = () => {
      setLocation(window.location.hash.slice(1) || "/")
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const navigate = (to: string) => {
    window.location.hash = to
  }

  return [location, navigate]
}

function App() {
  return (
    <RootProvider>
      <Router hook={useHashLocation}>
        <Route path="/" component={Homepage} />
        <Route path="/playground" component={Homepage} />
        <Route path="/mass-import" component={MassImport} />
        {/* Add more routes here as needed */}
      </Router>
    </RootProvider>
  )
}

export default App
