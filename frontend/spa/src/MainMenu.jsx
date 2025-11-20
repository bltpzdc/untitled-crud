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
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import {parseDiff, Diff, Hunk} from 'react-diff-view';


import SideMenu from './SideMenu.jsx'

import { storage, storage_bugs, tab_list } from './Data.js';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
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

const diff = `
diff --git a/1 b/2
index 5006ce3..d2248fb 100644
--- a/1
+++ b/2
@@ -1,8 +1,10 @@
 {
-  'Failure': {
+  'Success': {
     'operation': 'LSEEK',
-    'subcall': 'lseek',
-    'return_code': -1,
-    'errno': 22,
-    'strerror': 'Invalid argument'
+    'return_code': 1024,
+    'execution_time': 0,
+    'extra': {
+      'hash': null,
+      'timestamps': []
+    }
   }
`;

function renderFile({oldRevision, newRevision, type, hunks}) {
    return (
        <Diff key={oldRevision + '-' + newRevision} viewType='split' diffType={type} hunks={hunks}>
            {hunks => hunks.map(hunk => <Hunk key={hunk.content} hunk={hunk} />)}
        </Diff>
    );
}

export default function MainMenu() {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <>
      <AppBar 
        position='fixed'
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
        }}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          textColor='inherit'
          variant='fullWidth'
        >
        {
          tab_list.map((item, idx) => (
            <Tab label={item.text} key={index} {...a11yProps(index)} />
          ))
        }
          /* old version:
            {storage.map((item, index) => (
            <Tab label={item.text} key={index} {...a11yProps(index)} />
          ))}*/
        </Tabs>
      </AppBar>

      <SideMenu/>

      <Box
        component='main'
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          minWidth: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          p: 3,
        }}
      >
        {/* Toolbar is here to fix some collision issues,
         in accordance to something i have seen once somewhere in the docs
         hence: might be neither needed nor harmless*/}
        <Toolbar/>
        {storage.map((item, index) => (
          <TabPanel component={'span'} value={value} index={index} key={index}>
            {
              (console.log(item) || item.datatype == 'run') ?
              <>
              <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
                <Grid size={6}>
                  Дата и время: {item.run_time.toString()}
                </Grid>
                <Grid size={6}>
                  Комментарий: <TextField id='standard-basic' label='Standard' variant='standard' />
                </Grid>
                <Grid size={6}>
                  Файловые системы: {item.fstype.join(', ')}
                </Grid>
                <Grid size={6}>
                  Теги:
                </Grid>
                <Grid size={6}>
                  Анализатор: {item.analyzer}
                </Grid>
                <Grid size={6}>
                  <Button variant='text'>Удалить испытание</Button>
                </Grid>
              </Grid>
              <Accordion>
                <AccordionSummary
                  expandIcon={<ArrowDownwardIcon />}
                  aria-controls='panel1-content'
                  id='panel1-header'
                >
                Read
                </AccordionSummary>
                <AccordionDetails>
                  <Stack
                    sx={{
                      flexGrow: 1,
                      alignItems: 'stretch',
                      justifyContent: 'space-between' }}>
                    <List>
                    {
                      console.log('Building bugs list'), storage_bugs.filter(x => item.bugs.includes(x.key)).map((inner_item, idx) => {
                        console.log(item), console.log(inner_item), console.log(inner_item.key);
                        return (
                          <ListItem>
                            <ListItemButton>
                              <ListItemText key={inner_item.key} primary={inner_item.key} />
                            </ListItemButton>
                          </ListItem>
                        );
                      })
                    }
                    </List>
                  </Stack>
                </AccordionDetails>
              </Accordion>
              </>
              : parseDiff(diff).map(renderFile)
            }
          </TabPanel>
        ))}
      </Box>
    </>
  );
}
