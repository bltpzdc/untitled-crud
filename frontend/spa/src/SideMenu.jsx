import * as React from 'react';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SelectContent from './SelectContent.jsx';
import SideMenuContent from './SideMenuContent.jsx';
import OptionsMenu from './OptionsMenu.jsx';

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
        },
      }}
      variant='permanent'
      anchor='left'
    >
      <SelectContent callback={callback} />
      <Divider />

      {/* Vertical spacer */}
      <Box
        sx={{
          overflow: 'auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      />

      <Stack
        direction='row'
        sx={{
          p: 2,
          gap: 1,
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Avatar
          sizes='small'
          alt='User'
          src='/static/images/avatar/7.jpg'
          sx={{ width: 36, height: 36 }}
        />
        <Box sx={{ mr: 'auto' }}>
          <Typography variant='body2' sx={{ fontWeight: 500, lineHeight: '16px' }}>
            User
          </Typography>
          <Typography variant='caption' sx={{ color: 'text.secondary' }}>
            user@example.com
          </Typography>
        </Box>
        <OptionsMenu />
      </Stack>
    </Drawer>
  );
}
