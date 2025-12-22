import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CloseIcon from "@mui/icons-material/Close";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import * as React from "react";
import { Diff, Hunk } from "react-diff-view";
import "react-diff-view/style/index.css";

import SideMenu from "./SideMenu.jsx";

import { storage_bugs } from "./Data.js";

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
    "aria-controls": `mainmenu-fullwidth-tabpanel-${index}`,
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

function renderFile({ oldRevision, newRevision, type, hunks }) {
  return (
    <Diff
      key={oldRevision + "-" + newRevision}
      viewType="split"
      diffType={type}
      hunks={hunks}
    >
      {(hunks) => hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)}
    </Diff>
  );
}

export default function MainMenu() {
  const [value, setValue] = React.useState(0);
  //const [tablist, setTablist] = React.useState([...storage, ...storage_bugs]);
  const [tablist, setTablist] = React.useState([]);

  const tablistAppend = (x) => {
    setTablist([...tablist, x]);
  };

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
          variant="scrollable"
          scrollButtons={false}
        >
          {tablist.map((item, idx) => (
            <Tab
              key={idx}
              {...a11yProps(idx)}
              sx={{
                textTransform: "none",
                fontWeight: 400,
                minHeight: 40,
                height: 40,
                paddingTop: 0,
                paddingBottom: 0,
                alignItems: "flex-start",
                display: "flex",
                justifyContent: "space-between",
              }}
              label={
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span>{item.text}</span>
                  <IconButton
                    aria-label="close tab"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTablist((tabs) => {
                        const newTabs = tabs.filter((_, i) => i !== idx);
                        // Обновляем выбранный индекс, если нужно
                        if (value === idx) {
                          if (idx === 0) {
                            setValue(0);
                          } else {
                            setValue(idx - 1);
                          }
                        } else if (value > idx) {
                          setValue(value - 1);
                        }
                        return newTabs;
                      });
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </div>
              }
            />
          ))}
        </Tabs>
      </AppBar>

      <SideMenu callback={tablistAppend} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          p: 3,
        }}
      >
        {
          /* Toolbar is here to fix some collision issues,
         in accordance to something i have seen once somewhere in the docs
         hence: might be neither needed nor harmless*/
        }
        <Toolbar />

        {tablist.map((item, index) => (
          <TabPanel component={"span"} value={value} index={index} key={index}>
            {(item.datatype == "run")
              ? (
                <>
                  <Box sx={{ mt: 4, mb: 3, px: 6, width: "100%" }}>
                    <Box sx={{ display: "flex", mb: 2 }}>
                      {/* Левая колонка: дата/ФС/анализатор */}
                      <Box sx={{ flex: 1, mr: 6 }}>
                        {/* Дата и время */}
                        <Box sx={{ display: "flex", mb: 1 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ width: 140 }}
                          >
                            Дата и время:
                          </Typography>
                          <Typography variant="body1">
                            {item.run_time.toLocaleString("ru-RU", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </Box>

                        {/* Файловые системы */}
                        <Box sx={{ display: "flex", mb: 1 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ width: 140 }}
                          >
                            Файловые системы:
                          </Typography>
                          <Typography variant="body1">
                            {item.fstype.join(", ")}
                          </Typography>
                        </Box>

                        {/* Анализатор */}
                        <Box sx={{ display: "flex", mb: 1 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ width: 140 }}
                          >
                            Анализатор:
                          </Typography>
                          <Typography variant="body1">
                            {item.analyzer}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Правая колонка: комментарий + теги */}
                      <Box sx={{ flex: 1 }}>
                        {/* Комментарий */}
                        <Box sx={{ display: "flex", mb: 2 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ width: 110, lineHeight: "40px" }}
                          >
                            Комментарий
                          </Typography>
                          <TextField
                            size="small"
                            variant="outlined"
                            fullWidth
                            placeholder="Комментарий"
                          />
                        </Box>

                        {/* Теги */}
                        <Box sx={{ display: "flex" }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ width: 110, lineHeight: "32px" }}
                          >
                            Теги:
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {/* сюда потом добавишь Chip'ы и кнопку + */}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
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
                          alignItems: "stretch",
                          justifyContent: "space-between",
                        }}
                      >
                        <List>
                          {console.log("Building bugs list"),
                            storage_bugs.filter((x) =>
                              item.bugs.includes(x.key)
                            ).map((inner_item, idx) => {
                              console.log(item),
                                console.log(inner_item),
                                console.log(inner_item.key);
                              return (
                                <ListItem>
                                  <ListItemButton
                                    onClick={() => {
                                      setTablist([...tablist, inner_item]);
                                    }}
                                  >
                                    <ListItemText
                                      key={inner_item.key}
                                      primary={inner_item.key}
                                    />
                                  </ListItemButton>
                                </ListItem>
                              );
                            })}
                        </List>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </>
              )
              : (
                <>
                </>
              )}
          </TabPanel>
        ))}
      </Box>
    </>
  );
}
