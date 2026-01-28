import * as React from 'react';
import { styled } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import SelectContent from './SelectContent.jsx';
import SideMenuContent from './SideMenuContent.jsx';


// TODO(savikin): it's repeated in MainMenu, merge
const drawerWidth = 480;


export default function SideMenu({callback}) {
  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface-neutral-primary)',
          borderRight: '1px solid var(--border-neutral-primary)',
        },
      }}
      variant='permanent'
      anchor='left'
    >
      <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <SelectContent callback={callback} />
      </Box>
    </Drawer>
  );
}