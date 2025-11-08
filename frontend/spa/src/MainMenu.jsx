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

const diff = `
diff --git a/1 b/2
index 5006ce3..d2248fb 100644
--- a/1
+++ b/2
@@ -1,8 +1,10 @@
 {
-  "Failure": {
+  "Success": {
     "operation": "LSEEK",
-    "subcall": "lseek",
-    "return_code": -1,
-    "errno": 22,
-    "strerror": "Invalid argument"
+    "return_code": 1024,
+    "execution_time": 0,
+    "extra": {
+      "hash": null,
+      "timestamps": []
+    }
   }
`;

const runs = [
  { 
    datatype: "run",
    text: 'Испытание 1',
    run_time: new Date(),
    fstype: ['ext4', 'xfs'],
    analyzer: 'Diffuzzer v.deadbeef',

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

function renderFile({oldRevision, newRevision, type, hunks}) {
    return (
        <Diff key={oldRevision + '-' + newRevision} viewType="split" diffType={type} hunks={hunks}>
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
        {runs.map((item, index) => (
          <TabPanel component={'span'} value={value} index={index} key={index}>
            {
              (item.datatype == 'run') ?
              <>
              <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
                <Grid size={6}>
                  Дата и время: {item.run_time.toString()}
                </Grid>
                <Grid size={6}>
                  Комментарий: <TextField id="standard-basic" label="Standard" variant="standard" />
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
                  <Button variant="text">Удалить испытание</Button>
                </Grid>
              </Grid>
              <Accordion>
                <AccordionSummary
                  expandIcon={<ArrowDownwardIcon />}
                  aria-controls="panel1-content"
                  id="panel1-header"
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
                      <ListItem>
                        <ListItemButton >
                          <ListItemText primary="XHwSwS4tX2U-fpF2paBIfw==" />
                        </ListItemButton>
                      </ListItem>
                      <ListItem>
                        <ListItemButton >
                          <ListItemText primary="lCUmLg1qGCqHfdzIIHZY0w==" />
                        </ListItemButton>
                      </ListItem>
                      <ListItem>
                        <ListItemButton >
                          <ListItemText primary="LXBfPRz9NnttomSzB5in3Q==" />
                        </ListItemButton>
                      </ListItem>
                      <ListItem>
                        <ListItemButton >
                          <ListItemText primary="wWFa_9m7b-xlRufW0UMxUA==" />
                        </ListItemButton>
                      </ListItem>
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
