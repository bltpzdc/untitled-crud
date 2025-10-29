import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import CssBaseline from '@mui/material/CssBaseline';
import Button from '@mui/material/Button';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import SideMenu from './SideMenu.jsx'
import MainMenu from './MainMenu.jsx'

function App() {
  return (
    <>
      <SideMenu>
      </SideMenu>
      <MainMenu>
      </MainMenu>
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <CssBaseline>
    <StrictMode>
      <App>
      </App>
    </StrictMode>
  </CssBaseline>
)
