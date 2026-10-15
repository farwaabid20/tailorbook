import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LangProvider } from './i18n'
import App from './App'
import './styles.css'
createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><LangProvider><App /></LangProvider></BrowserRouter></React.StrictMode>)
