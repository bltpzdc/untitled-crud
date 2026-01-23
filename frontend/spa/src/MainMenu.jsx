import * as React from "react";

import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Chip from "@mui/material/Chip";
import AppBar from "@mui/material/AppBar";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import CloseIcon from "@mui/icons-material/Close";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import Button from "@mui/material/Button";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { createPatch, diffChars } from "diff";
import { Diff, Hunk, parseDiff } from "react-diff-view";
import "react-diff-view/style/index.css";
import "./DiffTheme.css"

import SideMenu from "./SideMenu.jsx";

import { datalayer } from "./DataLayer.js";

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
        <Box sx={{ p: 3, backgroundColor: "#ffffff" }}>
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
function formpatch(v1, v2) {
  let x = createPatch("test", v1, v2);
  x = x.split("\n");
  x.splice(0, 1);
  x.splice(0, 1);
  return x.join("\n");
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
      className="my-diff"
    >
      {(hunks) => hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)}
    </Diff>
  );
}

export default function MainMenu() {
  const [value, setValue] = React.useState(0);
  const [tablist, setTablist] = React.useState([]);

  const tablistAppend = (x) => {
    setTablist([...tablist, x]);
    console.log(tablist);
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
                  {
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
                  }
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
          p: 0,
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
                  {console.log("Rendering a run")}
                  {console.log(item)}
                  <Box sx={{ mt: 0, mb: 3, px: 0, width: "100%" }}>
                    <Box sx={{ display: "flex", mb: 2 }}>
                      {/* Левая колонка: дата/ФС/анализатор */}
                      <Box sx={{ flex: 1.1, mr: 6 }}>
                        {/* Дата и время */}
                        <Box sx={{ display: "flex", mb: 1 }}>
                          <Typography
                            variant="fieldHeader"
                            sx={{ width: 220 }}
                          >
                            Дата и время:
                          </Typography>
                          <Typography variant="fieldValue">
                            {item.datetime.toLocaleString("ru-RU", {
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
                            variant="fieldHeader"
                            sx={{ width: 220 }}
                          >
                            Файловые системы:
                          </Typography>
                          <Typography variant="fieldValue">
                            {item.fstype.join(", ")}
                          </Typography>
                        </Box>

                        {/* Анализатор */}
                        <Box sx={{ display: "flex", mb: 1 }}>
                          <Typography
                            variant="fieldHeader"
                            sx={{ width: 220 }}
                          >
                            Анализатор:
                          </Typography>
                          <Typography variant="fieldValue">
                            {item.analyzer}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Правая колонка: комментарий + теги */}
                      <Box sx={{ flex: 1 }}>
                        {/* Комментарий */}
                        <Box sx={{ display: "flex", mb: 2 }}>
                          <Typography
                            variant="fieldHeader"
                            sx={{ width: 110, lineHeight: "40px", mr: 2 }}
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
                            variant="fieldHeader"
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
                  <Accordion
                    elevation={0}
                    square
                    sx={{
                      borderTop: "none",
                      borderLeft: "none",
                      borderRight: "none",
                      borderBottom: "1px solid rgba(0,0,0,0.12)",
                      "&:before": { display: "none" },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Chip
                            label={(item.bugs?.length ?? 0).toString()}
                            color="var(--chip-info-default)"
                            size="small"
                            sx={{ borderRadius: 999, mr: 2.5 }}
                          />
                          <ExpandMoreIcon className="MuiAccordionSummary-expandIcon" />
                        </Box>
                      }
                      aria-controls="panel1-content"
                      id="panel1-header"
                      sx={{
                        minHeight: 48,
                        paddingLeft: 0,
                        "& .MuiAccordionSummary-content": {
                          margin: 0,
                        },
                        "& .MuiAccordionSummary-expandIconWrapper": {
                          transform: "none !important",
                        },
                      }}
                    >
                      <Typography variant="fieldHeader">Баги</Typography>
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
                            console.log(item),
                            item.bugs
                              .map((inner_item, idx) => {
                                console.log(item);
                                console.log(inner_item);
                                console.log(inner_item.ID);
                                return (
                                  <ListItem>
                                    <ListItemButton
                                      onClick={() => {
                                        setTablist([...tablist, inner_item]);
                                      }}
                                    >
                                      <ListItemText
                                        key={inner_item.ID}
                                        primary={`Баг: ${inner_item.ID}`}
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
                  {console.log("Rendering a bug")}
                  {console.log(item)}
                  {parseDiff(
                    formpatch(item.TestCases[0].Test, item.TestCases[1].Test),
                  ).map(renderFile)}
                </>
              )}
          </TabPanel>
        ))}
      </Box>
    </>
  );
}
