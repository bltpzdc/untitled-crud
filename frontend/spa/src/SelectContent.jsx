import * as React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import MuiAvatar from '@mui/material/Avatar';
import MuiListItemAvatar from '@mui/material/ListItemAvatar';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListSubheader from '@mui/material/ListSubheader';
import Select, { selectClasses } from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded';
import SmartphoneRoundedIcon from '@mui/icons-material/SmartphoneRounded';
import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded';
import SideMenuContent from './SideMenuContent.jsx';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { datalayer } from './DataLayer.js';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}

export default function SelectContent({callback}) {
  const [value, setValue] = React.useState(0);

  const [_uploadDummy, setUploadDummy] = React.useState(null);

  const handleChange = (event, newvalue) => {
    setValue(newvalue);
  };

  return (
    <Box style={{ width:'100%' }} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={value} onChange={handleChange} aria-label='Select mode'>
        <Tab style={{width:'90%'}} label='Список испытаний' {...a11yProps(0)} />
        <Tab style={{width:'10%'}} label='+' {...a11yProps(1)} />
      </Tabs>

      <TabPanel value={value} index={0}>
        <SideMenuContent callback={callback}/>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Button 
          variant='text'
          onClick={ ()=>{
            console.log('Clicked');
            const input = document.createElement('input');
            input.type = 'file';
            input.onchange = e => {
              console.log('On change');
              const file = e.target.files[0];
              datalayer.upload_zip(file).then(() => {setUploadDummy(null)});
            }
            input.click();
          }}
        >Загрузить ZIP</Button>
      </TabPanel>
    </Box>
  );
}
