import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SWRConfig } from 'swr'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import { request } from './api/http'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SWRConfig value={{
        fetcher: (key: string) => request(key),
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 5000,
      }}>
        <AuthProvider><App /></AuthProvider>
      </SWRConfig>
    </BrowserRouter>
  </React.StrictMode>,
)
