import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './i18n/i18n'

// Inject DB Neo web font when running under the DB brand
if (import.meta.env.VITE_BRAND === 'db') {
  const style = document.createElement('style');
  style.textContent = `
    @font-face { font-family:'DB Neo'; src:url('https://fonts.db.de/fonts/db-neo/db-neo-regular.woff2') format('woff2'), url('https://fonts.db.de/fonts/db-neo/db-neo-regular.woff') format('woff'); font-weight:400; font-style:normal; font-display:swap; }
    @font-face { font-family:'DB Neo'; src:url('https://fonts.db.de/fonts/db-neo/db-neo-medium.woff2') format('woff2'), url('https://fonts.db.de/fonts/db-neo/db-neo-medium.woff') format('woff'); font-weight:500; font-style:normal; font-display:swap; }
    @font-face { font-family:'DB Neo'; src:url('https://fonts.db.de/fonts/db-neo/db-neo-bold.woff2') format('woff2'), url('https://fonts.db.de/fonts/db-neo/db-neo-bold.woff') format('woff'); font-weight:600; font-style:normal; font-display:swap; }
  `;
  document.head.appendChild(style);

  // Swap favicon to DB logo
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (link) link.href = `${import.meta.env.BASE_URL}favicon.db.svg`;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)