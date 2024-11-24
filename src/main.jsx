import React from 'react'
import ReactDOM from 'react-dom/client'
import DirectoryTreeViewer from './components/DirectoryTreeViewer/index.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DirectoryTreeViewer />
  </React.StrictMode>,
)