import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { Toaster as SileoToaster } from "sileo";
import { initializeSwalSileoBridge } from "./utils/sileoToast";
import './styles/globals.css'
import 'animate.css'

initializeSwalSileoBridge();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <SileoToaster position="top-center" />
  </React.StrictMode>,
)
