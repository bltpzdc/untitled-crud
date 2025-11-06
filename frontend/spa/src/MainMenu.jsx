import * as React from 'react';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SelectContent from './SelectContent';
import OptionsMenu from './OptionsMenu';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';


import SideMenu from './SideMenu.jsx'

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mainmenu-fullwidth-tabpanel-${index}`}
      aria-labelledby={`mainmenu-fullwidth-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}
function a11yProps(index) {
  return {
    id: `mainmenu-fullwidth-tab-${index}`,
    'aria-controls': `mainmenu-fullwidth-tabpanel-${index}`,
  };
}


// TODO(savikin): it's repeated in SideMenu, merge
const drawerWidth = 480;

const hardcoded_reason = [
  {"Failure":{"operation":"LSEEK","subcall":"lseek","return_code":-1,"errno":22,"strerror":"Invalid argument"}},
  {"Success":{"operation":"LSEEK","return_code":1024,"execution_time":0,"extra":{"hash":null,"timestamps":[]}}}
]

const runs = [
  { 
    datatype: "run",
    text: 'Испытание 1',
    run_time: new Date(),
    fstype: ['ext4', 'xfs'],
    analyzer: '???',

    bugs: {
      truncate: {
      },
      rename: {
      }
    }
  },
  { 
    datatype: "bug",
    text: 'Баг 1',
    reason: hardcoded_reason,
  },
]

export default function MainMenu() {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <>
      <AppBar 
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
        }}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          textColor="inherit"
          variant="fullWidth"
        >
          {runs.map((item, index) => (
            <Tab label={item.text} key={index} {...a11yProps(index)} />
          ))}
        </Tabs>
      </AppBar>

      <SideMenu/>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          minWidth: '100vh',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          overflow: 'auto',
          p: 3,
        }}
      >
        {/* Toolbar is here to fix some collision issues,
         in accordance to something i have seen once somewhere in the docs
         hence: might be neither needed nor harmless*/}
        <Toolbar/>
        {runs.map((item, index) => (
          <TabPanel component={'span'} value={value} index={index} key={index}>
            {
              (item.datatype == 'run') ?
              <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
                <Grid size={6}>
                  Дата и время: {item.run_time.toString()}
                </Grid>
                <Grid size={6}>
                  Комментарий: <TextField id="outlined-basic" label="Outlined" variant="outlined" />
                </Grid>
                <Grid size={6}>
                  Файловые системы: {item.fstype.join(', ')}
                </Grid>
                <Grid size={6}>
                  Анализатор: {item.analyzer}
                </Grid>
                <Grid size={6}>
                </Grid>
              </Grid>
              : (JSON.stringify(item.reason))
            }
          </TabPanel>
        ))}
      </Box>
    </>
  );
}
