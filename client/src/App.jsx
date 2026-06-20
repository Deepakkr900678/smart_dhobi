import React from 'react'
import './App.css'
import AppRouter from './router'
import { ToastProvider } from "./components/toast/ToastProvider";

function App() {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  )
}

export default App
