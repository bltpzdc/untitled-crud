import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import CssBaseline from '@mui/material/CssBaseline';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import SideMenu from './SideMenu.jsx'
import MainMenu from './MainMenu.jsx'

createRoot(document.getElementById('root')).render(
  <CssBaseline>
    <StrictMode>
      <Box sx={{ display: 'flex' }}>
        <SideMenu/>
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            overflow: 'auto',
          })}
        >
          <MainMenu/>
        </Box>
      </Box>
    </StrictMode>
  </CssBaseline>
)
