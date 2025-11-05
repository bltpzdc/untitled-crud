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
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}
function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
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
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}>
        <Tabs
          value={value}
          onChange={handleChange}
          textColor="inherit"
          variant="fullWidth"
        >
          {runs.map((item, index) => (
            <Tab label={item.text} {...a11yProps(index)} />
          ))}
        </Tabs>
      </AppBar>
      {/* Toolbar is here to fix some collision issues,
       in accordance to something i have seen once somewhere in the docs
       hence: might be neither needed nor harmless*/}
      <Toolbar/>

      {runs.map((item, index) => (
        <TabPanel value={value} index={index}>
          {
            (item.datatype == 'run') ?  () : (JSON.stringify(item.reason))
          }
        </TabPanel>
      ))}
    </Box>
  );
}
