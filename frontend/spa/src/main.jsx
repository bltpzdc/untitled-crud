import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import CssBaseline from '@mui/material/CssBaseline';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import MainMenu from './MainMenu.jsx'


createRoot(document.getElementById('root')).render(
  <CssBaseline/>
  <StrictMode>
    <Box sx={{ display: 'flex' }}>
      {/* NOTE(savikin): put sidemenu inside MainMenu
       while working around layout bugs */}
      <MainMenu/>
    </Box>
  </StrictMode>
)
