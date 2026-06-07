import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import CsvGenerator from './CsvGenerator.jsx'

const Root = () => {
  const [mode, setMode] = React.useState(
    () => {
      const h = window.location.hash
      return (h === '#csv' || h === '#teacher' || h === '#csvadmin') ? 'csv' : 'main'
    }
  )
  React.useEffect(() => {
    const onHash = () => {
      const h = window.location.hash
      if (h === '#csv' || h === '#teacher' || h === '#csvadmin') setMode('csv')
      else setMode('main')
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return mode === 'csv' ? <CsvGenerator /> : <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Root /></React.StrictMode>
)