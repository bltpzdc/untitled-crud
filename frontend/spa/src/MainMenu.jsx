import * as React from 'react';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SelectContent from './SelectContent';
import MenuContent from './MenuContent';
import OptionsMenu from './OptionsMenu';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

const drawerWidth = 480;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  mt: 10,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
});

export default function MainMenu() {
  let value = 0;
  return (
    <Box style={{ width:"100%" }} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={value} aria-label="Select mode">
        <Tab style={{width:"50%"}} label="Просмотр"  />
        <Tab style={{width:"50%"}} label="Загрузка"  />
      </Tabs>
    </Box>
  );
}
