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
import DownloadIcon from "@mui/icons-material/Download";
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
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
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
  const [editingComments, setEditingComments] = React.useState({});
  const commentRefs = React.useRef({});
  // Состояние для выбранных FS для каждого бага (по ключу bugId)
  const [selectedFsForBugs, setSelectedFsForBugs] = React.useState({});

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
      window.dispatchEvent(new CustomEvent('runUpdated', { detail: { runId, tags: tagsArray } }));
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
      
      // Выходим из режима редактирования после сохранения
      setEditingComments(prev => {
        const updated = { ...prev };
        delete updated[runId];
        return updated;
      });
      
      window.dispatchEvent(new CustomEvent('runUpdated', { detail: { runId, comment: commentValue } }));
    } catch (error) {
      console.error("Failed to update comment:", error);
      console.error("Error details:", error.message);
      alert("Ошибка при сохранении комментария: " + error.message);
    }
  };

  const handleCommentClick = (runId) => {
    setEditingComments(prev => ({ ...prev, [runId]: true }));
    // Фокусируем поле ввода после небольшой задержки
    setTimeout(() => {
      if (commentRefs.current[runId]) {
        commentRefs.current[runId].focus();
      }
    }, 0);
  };

  const renderMarkdown = (text) => {
    if (!text || !text.trim()) {
      return null;
    }
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/g, '<br />');
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

  const handleDownloadArchive = async (runId) => {
    if (!runId) {
      console.error("Run ID is missing");
      return;
    }

    try {
      await datalayer.download_run_archive(runId);
    } catch (error) {
      console.error("Failed to download archive:", error);
      console.error("Error details:", error.message);
      alert("Ошибка при скачивании архива: " + error.message);
    }
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          backgroundColor: 'var(--surface-neutral-primary)',
          borderBottom: '1px solid var(--border-neutral-primary)',
          boxShadow: 'none',
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
          backgroundColor: 'var(--surface-neutral-secondary)',
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
            {(item.datatype === "run")
              ? (
                <>
                  {console.log("Rendering a run")}
                  {console.log(item)}
                  <Box sx={{ mt: 0, mb: 3, px: 3, width: "100%", backgroundColor: 'var(--surface-neutral-primary)' }}>
                    {/* Кнопки действий */}
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 3, pt: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadArchive(item.id)}
                        size="small"
                        sx={{
                          borderColor: 'var(--border-neutral-secondary)',
                          color: 'var(--text-neutral-primary)',
                          '&:hover': {
                            borderColor: 'var(--border-neutral-primary)',
                            backgroundColor: 'var(--surface-neutral-secondary)',
                          },
                        }}
                      >
                        Скачать архив
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteRun(item.id)}
                        size="small"
                        sx={{
                          borderColor: 'var(--border-neutral-secondary)',
                          color: '#D32F2F',
                          '&:hover': {
                            borderColor: '#D32F2F',
                            backgroundColor: 'rgba(211, 47, 47, 0.04)',
                          },
                        }}
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

                      {/* Правая колонка: теги + комментарий */}
                      <Box sx={{ flex: 1 }}>
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

                        {/* Комментарий */}
                        <Box sx={{ display: "flex", mt: 2, alignItems: "flex-start" }}>
                          <Typography
                            variant="fieldHeader"
                            sx={{ width: 110, lineHeight: "40px", mr: 2 }}
                          >
                            Комментарий
                          </Typography>
                          <Box sx={{ flex: 1 }}>
                            {editingComments[item.id] ? (
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
                                rows={5}
                                autoFocus
                              />
                            ) : (
                              <Box
                                onClick={() => handleCommentClick(item.id)}
                                sx={{
                                  minHeight: '40px',
                                  p: 1.5,
                                  border: '1px solid var(--border-neutral-secondary)',
                                  borderRadius: 1,
                                  backgroundColor: item.comment && item.comment.trim() ? 'var(--surface-neutral-primary)' : 'transparent',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    backgroundColor: 'var(--surface-neutral-secondary)',
                                    borderColor: 'var(--border-neutral-primary)',
                                  },
                                  '& p': { margin: '0.5em 0', color: 'var(--text-neutral-primary)' },
                                  '& h1, & h2, & h3, & h4, & h5, & h6': { margin: '0.5em 0', color: 'var(--text-neutral-primary)', fontWeight: 600 },
                                  '& ul, & ol': { margin: '0.5em 0', paddingLeft: '1.5em', color: 'var(--text-neutral-primary)' },
                                  '& code': { backgroundColor: 'var(--surface-neutral-secondary)', padding: '0.2em 0.4em', borderRadius: '0.25em', fontFamily: 'monospace', fontSize: '0.9em' },
                                  '& pre': { backgroundColor: 'var(--surface-neutral-secondary)', padding: '0.5em', borderRadius: '0.25em', overflow: 'auto' },
                                  '& blockquote': { borderLeft: '3px solid var(--border-neutral-primary)', paddingLeft: '1em', margin: '0.5em 0', color: 'var(--text-neutral-secondary)' },
                                  '& a': { color: 'var(--text-link-primary)' },
                                  '& strong': { fontWeight: 600 },
                                  '& em': { fontStyle: 'italic' },
                                }}
                                dangerouslySetInnerHTML={{
                                  __html: item.comment && item.comment.trim()
                                    ? renderMarkdown(item.comment)
                                    : '<span style="color: var(--text-neutral-secondary); font-style: italic;">Нажмите, чтобы добавить комментарий</span>'
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Заголовок "Баги" */}
                  <Box sx={{ mt: 3, mb: 2 }}>
                    <Typography variant="fieldHeader" sx={{ fontSize: "1.1rem", fontWeight: 500 }}>
                      Баги
                    </Typography>
                  </Box>

                  {/* Группировка багов: Operation -> первые 8 цифр ID -> список багов */}
                  {(() => {
                    // Сначала группируем по Operation (включая варианты вроде LSeek-Truncate)
                    const bugsByOperation = {};
                    (item.bugs || []).forEach((bug) => {
                      const operation = bug.Operation || bug.operation || "Без операции";
                      if (!bugsByOperation[operation]) {
                        bugsByOperation[operation] = [];
                      }
                      bugsByOperation[operation].push(bug);
                    });

                    // Сортируем операции по алфавиту
                    const sortedOperations = Object.keys(bugsByOperation).sort();

                    return sortedOperations.map((operation, opIdx) => {
                      const operationBugs = bugsByOperation[operation];
                      
                      // Внутри каждой операции группируем по первым 8 цифрам folder_id (ID из названия папки).
                      // Если folder_id отсутствует (старые данные до миграции), используем ID бага,
                      // чтобы такие баги не схлопывались в один "unknown".
                      const bugsByOperationId = {};
                      operationBugs.forEach((bug) => {
                        // Используем folderId, который приходит как строка (избегаем потери точности int64)
                        const rawId = bug.folderId || bug.FolderID;
                        let first8Digits = "unknown";
                        if (rawId !== undefined && rawId !== null) {
                          const idString = String(rawId);
                          // Оставляем только цифры и берем первые 8
                          const digitsOnly = idString.replace(/\D/g, "");
                          if (digitsOnly.length > 0) {
                            first8Digits = digitsOnly.substring(0, Math.min(8, digitsOnly.length));
                          }
                        } else {
                          // fallback: используем ID бага как ключ группировки
                          const bugId = bug.ID || bug.id;
                          if (bugId !== undefined && bugId !== null) {
                            first8Digits = `unknown-${bugId}`;
                          }
                        }
                        
                        if (!bugsByOperationId[first8Digits]) {
                          bugsByOperationId[first8Digits] = [];
                        }
                        bugsByOperationId[first8Digits].push(bug);
                      });

                      const sortedIds = Object.keys(bugsByOperationId).sort();

                      return (
                        <Accordion
                          key={`operation-${operation}-${opIdx}`}
                          elevation={0}
                          square
                          sx={{
                            borderTop: "none",
                            borderLeft: "none",
                            borderRight: "none",
                            borderBottom: "1px solid var(--border-neutral-primary)",
                            "&:before": { display: "none" },
                            backgroundColor: 'var(--surface-neutral-primary)',
                          }}
                        >
                          <AccordionSummary
                            expandIcon={
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Chip
                                  label={operationBugs.length.toString()}
                                  color="var(--chip-info-default)"
                                  size="small"
                                  sx={{ borderRadius: 999, mr: 2.5 }}
                                />
                                <ExpandMoreIcon className="MuiAccordionSummary-expandIcon" />
                              </Box>
                            }
                            aria-controls={`panel-operation-${operation}`}
                            id={`header-operation-${operation}`}
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
                            <Typography variant="fieldHeader">{operation}</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Stack sx={{ gap: 1 }}>
                              {sortedIds.map((first8Digits, idIdx) => {
                                const bugsForId = bugsByOperationId[first8Digits];
                                return (
                                  <Accordion
                                    key={`id-${first8Digits}-${idIdx}`}
                                    elevation={0}
                                    square
                                    sx={{
                                      border: '1px solid var(--border-neutral-secondary)',
                                      "&:before": { display: "none" },
                                      backgroundColor: 'var(--surface-neutral-secondary)',
                                    }}
                                  >
                                    <AccordionSummary
                                      expandIcon={
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                          <Chip
                                            label={bugsForId.length.toString()}
                                            size="small"
                                            sx={{ borderRadius: 999, mr: 2.5, fontSize: '0.75rem' }}
                                          />
                                          <ExpandMoreIcon className="MuiAccordionSummary-expandIcon" />
                                        </Box>
                                      }
                                      sx={{
                                        minHeight: 40,
                                        paddingLeft: 1,
                                        "& .MuiAccordionSummary-content": {
                                          margin: 0,
                                        },
                                      }}
                                    >
                                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                        {first8Digits}
                                      </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                      <List sx={{ py: 0 }}>
                                        {bugsForId.flatMap((bug, bugIdx) => {
                                          const tcList = Array.isArray(bug.TestCases) ? bug.TestCases : [];
                                          return tcList.map((tc, tcIdx) => {
                                            const tcHash = tc.Hash || tc.hash || null;
                                            const label = tcHash || `Баг ${bug.ID || bug.id || bugIdx}-${tcIdx}`;
                                            return (
                                              <ListItem key={`${bug.ID || bug.id || bugIdx}-${tcIdx}`} sx={{ py: 0.5 }}>
                                                <ListItemButton
                                                  onClick={() => {
                                                    // Добавляем datatype для бага; можно сохранить выбранный тест-кейс
                                                    const bugWithDatatype = { ...bug, datatype: "bug", selectedTestCase: tc };
                                                    setTablist([...tablist, bugWithDatatype]);
                                                  }}
                                                  sx={{ py: 0.5, minHeight: 36 }}
                                                >
                                                  <ListItemText
                                                    primary={
                                                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                                        {label}
                                                      </Typography>
                                                    }
                                                  />
                                                </ListItemButton>
                                              </ListItem>
                                            );
                                          });
                                        })}
                                      </List>
                                    </AccordionDetails>
                                  </Accordion>
                                );
                              })}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      );
                    });
                  })()}
                </>
              )
              : (item.datatype === "bug" ? (
                <>
                  {console.log("Rendering a bug")}
                  {console.log(item)}
                  
                  {(() => {
                    // Собираем все доступные FS из всех TestCases
                    const allFs = new Set();
                    if (item.TestCases && Array.isArray(item.TestCases)) {
                      item.TestCases.forEach(tc => {
                        if (tc.FSSummaries && Array.isArray(tc.FSSummaries)) {
                          tc.FSSummaries.forEach(fs => {
                            if (fs.FsName) {
                              allFs.add(fs.FsName);
                            }
                          });
                        }
                      });
                    }
                    const availableFsList = Array.from(allFs).sort();
                    
                    // Получаем или создаем состояние для выбранных FS для этого бага
                    const bugKey = `bug-${item.ID || item.id || 'unknown'}`;
                    const defaultFs = {
                      trace: { left: availableFsList[0] || '', right: availableFsList[1] || availableFsList[0] || '' },
                      stdout: { left: availableFsList[0] || '', right: availableFsList[1] || availableFsList[0] || '' },
                      stderr: { left: availableFsList[0] || '', right: availableFsList[1] || availableFsList[0] || '' }
                    };
                    const bugFsState = selectedFsForBugs[bugKey] || defaultFs;
                    
                    const updateBugFs = (type, side, value) => {
                      setSelectedFsForBugs(prev => ({
                        ...prev,
                        [bugKey]: {
                          ...(prev[bugKey] || defaultFs),
                          [type]: {
                            ...(prev[bugKey]?.[type] || defaultFs[type]),
                            [side]: value
                          }
                        }
                      }));
                    };
                    
                    const selectedFsTrace = bugFsState.trace || defaultFs.trace;
                    const selectedFsStdout = bugFsState.stdout || defaultFs.stdout;
                    const selectedFsStderr = bugFsState.stderr || defaultFs.stderr;
                    
                    // Функция для получения FSSummary по имени FS из TestCase
                    const getFsSummary = (testCase, fsName) => {
                      if (!testCase || !testCase.FSSummaries || !Array.isArray(testCase.FSSummaries)) {
                        return null;
                      }
                      return testCase.FSSummaries.find(fs => fs.FsName === fsName) || null;
                    };
                    
                    // Функция для получения данных trace/stdout/stderr из FSSummary
                    const getTraceData = (fsSummary) => {
                      if (!fsSummary || !fsSummary.FsTrace) return '';
                      if (typeof fsSummary.FsTrace === 'string') return fsSummary.FsTrace;
                      if (fsSummary.FsTrace.String) return fsSummary.FsTrace.String;
                      return '';
                    };
                    
                    return (
                      <>
                        {/* Аккордион для test.json */}
                  {item.TestCases && item.TestCases.length > 0 && (
                    <Accordion defaultExpanded elevation={0} square sx={{ mb: 2, border: '1px solid var(--border-neutral-primary)', "&:before": { display: "none" } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="fieldHeader">test.json</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                          <pre style={{ margin: 0, padding: '1em', backgroundColor: 'var(--surface-neutral-secondary)', borderRadius: '4px', fontSize: '0.875rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {(() => {
                              const testData = item.TestCases[0]?.Test;
                              if (!testData) return 'Нет данных';
                              if (typeof testData === 'string') return testData;
                              if (testData.String) return testData.String;
                              try {
                                return JSON.stringify(testData, null, 2);
                              } catch (e) {
                                return String(testData);
                              }
                            })()}
                          </pre>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  )}

                        {/* Аккордион для trace (diff) */}
                        {item.TestCases && item.TestCases.length > 0 && availableFsList.length >= 2 && (
                          <Accordion elevation={0} square sx={{ mb: 2, border: '1px solid var(--border-neutral-primary)', "&:before": { display: "none" } }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="fieldHeader">trace</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Stack spacing={2}>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                  <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>FS (слева)</InputLabel>
                                    <Select
                                      value={selectedFsTrace.left}
                                      label="FS (слева)"
                                      onChange={(e) => updateBugFs('trace', 'left', e.target.value)}
                                    >
                                      {availableFsList.map(fs => (
                                        <MenuItem key={fs} value={fs}>{fs}</MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                  <Typography variant="body2" sx={{ color: 'var(--text-neutral-secondary)' }}>vs</Typography>
                                  <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>FS (справа)</InputLabel>
                                    <Select
                                      value={selectedFsTrace.right}
                                      label="FS (справа)"
                                      onChange={(e) => updateBugFs('trace', 'right', e.target.value)}
                                    >
                                      {availableFsList.map(fs => (
                                        <MenuItem key={fs} value={fs}>{fs}</MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Box>
                                {(() => {
                                  const tc0 = item.TestCases[0];
                                  const fs0 = getFsSummary(tc0, selectedFsTrace.left);
                                  const fs1 = getFsSummary(tc0, selectedFsTrace.right);
                                  const trace0 = getTraceData(fs0);
                                  const trace1 = getTraceData(fs1);
                                  
                                  if (!trace0 && !trace1) {
                                    return (
                                      <Box sx={{ p: 2, color: 'var(--text-neutral-secondary)' }}>
                                        Нет данных для выбранных FS
                                      </Box>
                                    );
                                  }
                                  
                                  return (
                                    <Box>
                                      {parseDiff(
                                        formpatch(trace0 || '', trace1 || ''),
                                      ).map(renderFile)}
                                    </Box>
                                  );
                                })()}
                              </Stack>
                            </AccordionDetails>
                          </Accordion>
                        )}

                        {/* Аккордион для stdout (если есть данные) */}
                        {item.TestCases && item.TestCases.length > 0 && availableFsList.length >= 2 && (
                          <Accordion elevation={0} square sx={{ mb: 2, border: '1px solid var(--border-neutral-primary)', "&:before": { display: "none" } }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="fieldHeader">stdout</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Stack spacing={2}>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                  <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>FS (слева)</InputLabel>
                                    <Select
                                      value={selectedFsStdout.left}
                                      label="FS (слева)"
                                      onChange={(e) => updateBugFs('stdout', 'left', e.target.value)}
                                    >
                                      {availableFsList.map(fs => (
                                        <MenuItem key={fs} value={fs}>{fs}</MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                  <Typography variant="body2" sx={{ color: 'var(--text-neutral-secondary)' }}>vs</Typography>
                                  <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>FS (справа)</InputLabel>
                                    <Select
                                      value={selectedFsStdout.right}
                                      label="FS (справа)"
                                      onChange={(e) => updateBugFs('stdout', 'right', e.target.value)}
                                    >
                                      {availableFsList.map(fs => (
                                        <MenuItem key={fs} value={fs}>{fs}</MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Box>
                                {(() => {
                                  const tc0 = item.TestCases[0];
                                  const fs0 = getFsSummary(tc0, selectedFsStdout.left);
                                  const fs1 = getFsSummary(tc0, selectedFsStdout.right);
                                  
                                  // Пытаемся найти stdout в FSSummary или в TestCase
                                  let stdout0 = '';
                                  let stdout1 = '';
                                  
                                  if (fs0 && fs0.Stdout !== undefined) {
                                    stdout0 = typeof fs0.Stdout === 'string' ? fs0.Stdout : JSON.stringify(fs0.Stdout);
                                  } else if (tc0.Stdout !== undefined) {
                                    stdout0 = typeof tc0.Stdout === 'string' ? tc0.Stdout : JSON.stringify(tc0.Stdout);
                                  }
                                  
                                  if (fs1 && fs1.Stdout !== undefined) {
                                    stdout1 = typeof fs1.Stdout === 'string' ? fs1.Stdout : JSON.stringify(fs1.Stdout);
                                  } else if (tc0.Stdout !== undefined) {
                                    stdout1 = typeof tc0.Stdout === 'string' ? tc0.Stdout : JSON.stringify(tc0.Stdout);
                                  }
                                  
                                  if (!stdout0 && !stdout1) {
                                    return (
                                      <Box sx={{ p: 2, color: 'var(--text-neutral-secondary)' }}>
                                        Нет данных для выбранных FS
                                      </Box>
                                    );
                                  }
                                  
                                  return (
                                    <Box>
                                      {parseDiff(
                                        formpatch(stdout0 || '', stdout1 || ''),
                                      ).map(renderFile)}
                                    </Box>
                                  );
                                })()}
                              </Stack>
                            </AccordionDetails>
                          </Accordion>
                        )}

                        {/* Аккордион для stderr (если есть данные) */}
                        {item.TestCases && item.TestCases.length > 0 && availableFsList.length >= 2 && (
                          <Accordion elevation={0} square sx={{ mb: 2, border: '1px solid var(--border-neutral-primary)', "&:before": { display: "none" } }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="fieldHeader">stderr</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Stack spacing={2}>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                  <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>FS (слева)</InputLabel>
                                    <Select
                                      value={selectedFsStderr.left}
                                      label="FS (слева)"
                                      onChange={(e) => updateBugFs('stderr', 'left', e.target.value)}
                                    >
                                      {availableFsList.map(fs => (
                                        <MenuItem key={fs} value={fs}>{fs}</MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                  <Typography variant="body2" sx={{ color: 'var(--text-neutral-secondary)' }}>vs</Typography>
                                  <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>FS (справа)</InputLabel>
                                    <Select
                                      value={selectedFsStderr.right}
                                      label="FS (справа)"
                                      onChange={(e) => updateBugFs('stderr', 'right', e.target.value)}
                                    >
                                      {availableFsList.map(fs => (
                                        <MenuItem key={fs} value={fs}>{fs}</MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Box>
                                {(() => {
                                  const tc0 = item.TestCases[0];
                                  const fs0 = getFsSummary(tc0, selectedFsStderr.left);
                                  const fs1 = getFsSummary(tc0, selectedFsStderr.right);
                                  
                                  // Пытаемся найти stderr в FSSummary или в TestCase
                                  let stderr0 = '';
                                  let stderr1 = '';
                                  
                                  if (fs0 && fs0.Stderr !== undefined) {
                                    stderr0 = typeof fs0.Stderr === 'string' ? fs0.Stderr : JSON.stringify(fs0.Stderr);
                                  } else if (tc0.Stderr !== undefined) {
                                    stderr0 = typeof tc0.Stderr === 'string' ? tc0.Stderr : JSON.stringify(tc0.Stderr);
                                  }
                                  
                                  if (fs1 && fs1.Stderr !== undefined) {
                                    stderr1 = typeof fs1.Stderr === 'string' ? fs1.Stderr : JSON.stringify(fs1.Stderr);
                                  } else if (tc0.Stderr !== undefined) {
                                    stderr1 = typeof tc0.Stderr === 'string' ? tc0.Stderr : JSON.stringify(tc0.Stderr);
                                  }
                                  
                                  if (!stderr0 && !stderr1) {
                                    return (
                                      <Box sx={{ p: 2, color: 'var(--text-neutral-secondary)' }}>
                                        Нет данных для выбранных FS
                                      </Box>
                                    );
                                  }
                                  
                                  return (
                                    <Box>
                                      {parseDiff(
                                        formpatch(stderr0 || '', stderr1 || ''),
                                      ).map(renderFile)}
                                    </Box>
                                  );
                                })()}
                              </Stack>
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </>
                    );
                  })()}

                  {/* Аккордион для reason.md (если есть данные) */}
                  {item.TestCases && item.TestCases.length >= 2 && item.TestCases[0]?.Reason !== undefined && (
                    <Accordion elevation={0} square sx={{ mb: 2, border: '1px solid var(--border-neutral-primary)', "&:before": { display: "none" } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="fieldHeader">reason.md</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {item.TestCases[0].Reason && item.TestCases[1].Reason ? (
                          <Box>
                            {parseDiff(
                              formpatch(
                                typeof item.TestCases[0].Reason === 'string' ? item.TestCases[0].Reason : JSON.stringify(item.TestCases[0].Reason),
                                typeof item.TestCases[1].Reason === 'string' ? item.TestCases[1].Reason : JSON.stringify(item.TestCases[1].Reason)
                              ),
                            ).map(renderFile)}
                          </Box>
                        ) : (
                          <Box sx={{ p: 2, color: 'var(--text-neutral-secondary)' }}>
                            Нет данных
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  )}
                </>
              ) : null)}
          </TabPanel>
        ))}
      </Box>
    </>
  );
}
