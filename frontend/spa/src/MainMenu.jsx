import * as React from "react";

import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Chip from "@mui/material/Chip";
import AppBar from "@mui/material/AppBar";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
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
import Autocomplete from "@mui/material/Autocomplete";
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
  const [availableTags, setAvailableTags] = React.useState([]);
  const commentRefs = React.useRef({});

  React.useEffect(() => {
    async function get_tags() {
      try {
        const tags = await datalayer.get_all_tags();
        console.log("Loaded tags:", tags);
        setAvailableTags(Array.isArray(tags) ? tags : []);
      } catch (error) {
        console.error("Failed to load tags:", error);
        setAvailableTags([]);
      }
    }
    get_tags();
  }, []);

  const tablistAppend = (x) => {
    setTablist([...tablist, x]);
    console.log(tablist);
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleTagsChange = async (runId, newTags) => {
    if (!runId) {
      console.error("Run ID is missing");
      return;
    }
    const tagsArray = (newTags || [])
      .filter(tag => tag != null && tag !== '')
      .map(tag => {
        if (typeof tag === 'string') {
          return tag.trim();
        }
        if (tag && typeof tag === 'object' && tag.inputValue) {
          return String(tag.inputValue).trim();
        }
        if (tag && typeof tag === 'object' && tag.name) {
          return String(tag.name).trim();
        }
        return String(tag).trim();
      })
      .filter(tag => tag.length > 0);
    
    console.log("Updating tags for run", runId, "with tags:", tagsArray);
    
    try {
      await datalayer.update_run_tags(runId, tagsArray);
      setTablist(prevTablist => prevTablist.map(tab => 
        tab.id === runId ? { ...tab, tags: tagsArray } : tab
      ));
      
      setAvailableTags(prevTags => {
        const existingTags = new Set(prevTags.map(t => String(t)));
        tagsArray.forEach(tag => {
          const tagStr = String(tag);
          if (!existingTags.has(tagStr)) {
            existingTags.add(tagStr);
          }
        });
        return Array.from(existingTags).sort();
      });
      
      window.dispatchEvent(new CustomEvent('tagsUpdated', { detail: tagsArray }));
    } catch (error) {
      console.error("Failed to update tags:", error);
      console.error("Error details:", error.message);
    }
  };

  const handleCommentChange = async (runId, newComment) => {
    if (!runId) {
      console.error("Run ID is missing");
      return;
    }

    const commentValue = newComment ? newComment.trim() : "";

    console.log("Updating comment for run", runId, "with comment:", commentValue);

    try {
      await datalayer.update_run_comment(runId, commentValue === "" ? null : commentValue);
      console.log("Comment updated successfully on server");
      
      setTablist(prevTablist => {
        const updated = prevTablist.map(tab => {
          if (tab.id === runId) {
            console.log("Updating tab comment from", tab.comment, "to", commentValue);
            return { ...tab, comment: commentValue };
          }
          return tab;
        });
        console.log("Updated tablist:", updated);
        return updated;
      });
    } catch (error) {
      console.error("Failed to update comment:", error);
      console.error("Error details:", error.message);
      alert("Ошибка при сохранении комментария: " + error.message);
    }
  };

  const handleDeleteRun = async (runId) => {
    if (!runId) {
      console.error("Run ID is missing");
      return;
    }

    if (!window.confirm("Вы уверены, что хотите удалить это испытание?")) {
      return;
    }

    console.log("Deleting run", runId);

    try {
      await datalayer.delete_run(runId);
      
      const deletedIndex = tablist.findIndex(tab => tab.id === runId);
      
      setTablist(prevTablist => prevTablist.filter(tab => tab.id !== runId));
      
      if (deletedIndex !== -1) {
        if (value === deletedIndex) {
          if (deletedIndex > 0) {
            setValue(deletedIndex - 1);
          } else if (tablist.length > 1) {
            setValue(0);
          } else {
            setValue(0);
          }
        } else if (value > deletedIndex) {
          setValue(value - 1);
        }
      }
      
      window.dispatchEvent(new Event('runDeleted'));
    } catch (error) {
      console.error("Failed to delete run:", error);
      console.error("Error details:", error.message);
      alert("Ошибка при удалении испытания: " + error.message);
    }
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
          <TabPanel component={"span"} value={value} index={index} key={`${item.id}-${item.datatype}-${index}`}>
            {(item.datatype == "run")
              ? (
                <>
                  {console.log("Rendering a run")}
                  {console.log(item)}
                  <Box sx={{ mt: 0, mb: 3, px: 0, width: "100%" }}>
                    {/* Кнопка удаления испытания */}
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteRun(item.id)}
                        size="small"
                      >
                        Удалить испытание
                      </Button>
                    </Box>
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
                        <Box sx={{ display: "flex", mb: 2, alignItems: "flex-start" }}>
                          <Typography
                            variant="fieldHeader"
                            sx={{ width: 110, lineHeight: "40px", mr: 2 }}
                          >
                            Комментарий
                          </Typography>
                          <Box sx={{ flex: 1 }}>
                            <TextField
                              size="small"
                              variant="outlined"
                              fullWidth
                              placeholder="Комментарий (Enter для сохранения, Shift+Enter для новой строки)"
                              value={item.comment !== undefined && item.comment !== null ? item.comment : ""}
                              inputRef={(ref) => {
                                if (ref) {
                                  commentRefs.current[item.id] = ref;
                                }
                              }}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setTablist(prevTablist => prevTablist.map(tab =>
                                  tab.id === item.id ? { ...tab, comment: newValue } : tab
                                ));
                                if (commentRefs.current[item.id]) {
                                  commentRefs.current[item.id].value = newValue;
                                }
                              }}
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  const inputElement = e.target;
                                  const currentValue = inputElement.value;
                                  console.log("Saving comment on Enter:", currentValue);
                                  await handleCommentChange(item.id, currentValue);
                                  inputElement.blur();
                                }
                              }}
                              onBlur={async (e) => {
                                const inputElement = e.target;
                                const currentValue = inputElement.value;
                                console.log("Saving comment on blur:", currentValue);
                                await handleCommentChange(item.id, currentValue);
                              }}
                              multiline
                              rows={3}
                            />
                          </Box>
                        </Box>

                        {/* Теги */}
                        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                          <Typography
                            variant="fieldHeader"
                            sx={{ width: 110, lineHeight: "40px", mr: 2 }}
                          >
                            Теги:
                          </Typography>
                          {(() => {
                            try {
                              const safeTags = Array.isArray(item.tags) 
                                ? item.tags
                                    .filter(tag => tag != null && tag !== '')
                                    .map(tag => String(tag).trim())
                                    .filter(tag => tag.length > 0)
                                : [];
                              
                              const safeOptions = Array.isArray(availableTags) 
                                ? availableTags
                                    .filter(opt => opt != null && opt !== '')
                                    .map(opt => String(opt).trim())
                                    .filter(opt => opt.length > 0)
                                : [];
                              
                              return (
                                <Autocomplete
                                  multiple
                                  options={safeOptions}
                                  value={safeTags}
                                  isOptionEqualToValue={(option, value) => {
                                    return String(option || '') === String(value || '');
                                  }}
                                  onChange={async (event, newValue, reason) => {
                                    try {
                                      console.log("Autocomplete onChange:", { newValue, reason, itemId: item.id });
                                      if (!item.id) {
                                        console.error("Item ID is missing");
                                        return;
                                      }
                                      
                                      const stringTags = (newValue || [])
                                        .filter(tag => tag != null)
                                        .map(tag => {
                                          if (typeof tag === 'string') {
                                            return tag.trim();
                                          }
                                          if (tag && typeof tag === 'object' && tag.inputValue) {
                                            return String(tag.inputValue).trim();
                                          }
                                          return String(tag || '').trim();
                                        })
                                        .filter(tag => tag.length > 0);
                                      
                                      console.log("Saving tags:", stringTags);
                                      await handleTagsChange(item.id, stringTags);
                                    } catch (error) {
                                      console.error("Error in onChange:", error);
                                    }
                                  }}
                                  freeSolo
                                  selectOnFocus
                                  clearOnBlur
                                  handleHomeEndKeys
                                  getOptionLabel={(option) => {
                                    if (option == null || option === '') {
                                      return '';
                                    }
                                    return String(option);
                                  }}
                                  filterOptions={(options, params) => {
                                    const inputValue = (params.inputValue || '').trim().toLowerCase();
                                    
                                    const filtered = options
                                      .filter(option => option != null)
                                      .map(option => String(option))
                                      .filter(option => {
                                        const optionValue = option.toLowerCase();
                                        return optionValue.includes(inputValue);
                                      });
                                    
                                    if (inputValue.length > 0) {
                                      const exists = filtered.some(opt => 
                                        opt.toLowerCase() === inputValue
                                      );
                                      if (!exists) {
                                        filtered.push(inputValue);
                                      }
                                    }
                                    
                                    return filtered;
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      size="small"
                                      placeholder="Добавить теги (введите и нажмите Enter)"
                                      fullWidth
                                    />
                                  )}
                                  renderTags={(value, getTagProps) => {
                                    if (!Array.isArray(value)) {
                                      return null;
                                    }
                                    return value
                                      .filter(tag => tag != null && tag !== '')
                                      .map((option, index) => {
                                        const label = String(option).trim();
                                        
                                        if (!label) {
                                          return null;
                                        }
                                        
                                        return (
                                          <Chip
                                            key={`tag-${item.id}-${index}-${label}`}
                                            label={label}
                                            size="small"
                                            {...getTagProps({ index })}
                                          />
                                        );
                                      })
                                      .filter(Boolean);
                                  }}
                                  sx={{ flex: 1 }}
                                />
                              );
                            } catch (e) {
                              console.error("Error rendering Autocomplete:", e, e.stack);
                              return (
                                <TextField
                                  size="small"
                                  placeholder="Ошибка загрузки тегов"
                                  fullWidth
                                  disabled
                                  error
                                  helperText="Не удалось загрузить поле тегов"
                                />
                              );
                            }
                          })()}
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
