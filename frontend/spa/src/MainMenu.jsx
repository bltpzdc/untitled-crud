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
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
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
        <Box sx={{ p: 3, backgroundColor: 'var(--surface-neutral-primary)' }}>
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

// Нормализуем текст для diff: если это JSON (или объект), красиво форматируем
function normalizeForDiff(raw) {
  if (raw == null) return "";

  // Если уже не строка — пробуем отдать как красиво отформатированный JSON
  if (typeof raw !== "string") {
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return String(raw);
    }
  }

  // Если строка похожа на JSON — парсим и форматируем
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    // Не JSON — нормализуем переносы строк
    // Нормализуем Windows и старые Mac line endings
    let normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Убираем trailing newlines для единообразия
    normalized = normalized.replace(/\n+$/, '');
    return normalized;
  }
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

export default function MainMenu({ themeMode = 'light', setThemeMode = () => {} }) {
  const [value, setValue] = React.useState(0);
  const [tablist, setTablist] = React.useState([]);
  const [availableTags, setAvailableTags] = React.useState([]);
  const [editingComments, setEditingComments] = React.useState({});
  const commentRefs = React.useRef({});
  // Состояние для выбранных FS и режима вывода для каждого бага (по ключу bugId)
  const [selectedFsForBugs, setSelectedFsForBugs] = React.useState({});
  // Состояние для режима отображения test.json (по ключу itemId)
  const [testViewModes, setTestViewModes] = React.useState({});
  // Состояние для полноэкранного просмотра таблицы test.json (по ключу itemId)
  const [testFullscreenOpen, setTestFullscreenOpen] = React.useState({});
  // Состояние для режима отображения diff (JSON/таблица) для каждого бага (по ключу bugId-kind)
  const [diffViewModes, setDiffViewModes] = React.useState({});
  // Состояние для полноэкранного просмотра таблицы diff (по ключу bugId-kind)
  const [diffFullscreenOpen, setDiffFullscreenOpen] = React.useState({});

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
    // Функция для сравнения вкладок - проверяем, является ли вкладка той же самой
    const isSameTab = (tab1, tab2) => {
      if (tab1.datatype !== tab2.datatype) return false;
      
      if (tab1.datatype === "run") {
        // Для run сравниваем по id
        return tab1.id === tab2.id;
      } else if (tab1.datatype === "bug") {
        // Для bug сравниваем по id бага и selectedTestCase
        const id1 = tab1.ID || tab1.id;
        const id2 = tab2.ID || tab2.id;
        if (id1 !== id2) return false;
        
        // Сравниваем selectedTestCase по Hash
        const tc1Hash = tab1.selectedTestCase?.Hash || tab1.selectedTestCase?.hash;
        const tc2Hash = tab2.selectedTestCase?.Hash || tab2.selectedTestCase?.hash;
        return tc1Hash === tc2Hash;
      }
      
      return false;
    };
    
    // Проверяем, есть ли уже такая вкладка
    const existingIndex = tablist.findIndex(tab => isSameTab(tab, x));
    
    if (existingIndex !== -1) {
      // Вкладка уже существует - переключаемся на неё
      setValue(existingIndex);
    } else {
      // Вкладки нет - создаём новую
      setTablist((prevTablist) => {
        const newTablist = [...prevTablist, x];
        // Переключаемся на новую вкладку
        setValue(newTablist.length - 1);
        return newTablist;
      });
    }
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

  const handleBugTagsChange = async (bugId, newTags) => {
    if (!bugId) {
      console.error("Bug ID is missing");
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
    
    console.log("Updating tags for bug", bugId, "with tags:", tagsArray);
    
    try {
      await datalayer.update_bug_tags(bugId, tagsArray);
      setTablist(prevTablist => prevTablist.map(tab => {
        if (tab.datatype === "bug" && (tab.ID === bugId || tab.id === bugId)) {
          return { ...tab, tags: tagsArray };
        }
        return tab;
      }));
      
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
      window.dispatchEvent(new CustomEvent('bugUpdated', { detail: { bugId, tags: tagsArray } }));
    } catch (error) {
      console.error("Failed to update bug tags:", error);
      console.error("Error details:", error.message);
    }
  };

  const handleBugCommentChange = async (bugId, newComment) => {
    if (!bugId) {
      console.error("Bug ID is missing");
      return;
    }

    const commentValue = newComment ? newComment.trim() : "";

    console.log("Updating comment for bug", bugId, "with comment:", commentValue);

    try {
      await datalayer.update_bug_comment(bugId, commentValue === "" ? null : commentValue);
      console.log("Bug comment updated successfully on server");
      
      setTablist(prevTablist => {
        const updated = prevTablist.map(tab => {
          if (tab.datatype === "bug" && (tab.ID === bugId || tab.id === bugId)) {
            console.log("Updating bug tab comment from", tab.comment, "to", commentValue);
            return { ...tab, comment: commentValue };
          }
          return tab;
        });
        console.log("Updated tablist:", updated);
        return updated;
      });
      
      window.dispatchEvent(new CustomEvent('bugUpdated', { detail: { bugId, comment: commentValue } }));
      
      // Выходим из режима редактирования после сохранения
      setEditingComments(prev => {
        const updated = { ...prev };
        delete updated[`bug-${bugId}`];
        return updated;
      });
    } catch (error) {
      console.error("Failed to update bug comment:", error);
      console.error("Error details:", error.message);
      alert("Ошибка при сохранении комментария: " + error.message);
    }
  };

  const handleBugCommentClick = (bugId) => {
    setEditingComments(prev => ({ ...prev, [`bug-${bugId}`]: true }));
    // Фокусируем поле ввода после небольшой задержки
    setTimeout(() => {
      if (commentRefs.current[`bug-${bugId}`]) {
        commentRefs.current[`bug-${bugId}`].focus();
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

  const handleDownloadBugArchive = async (bugId, testCaseHash, item) => {
    if (!bugId) {
      console.error("Bug ID is missing");
      return;
    }
    
    // Если hash не указан, пытаемся найти его из item
    let hashToUse = testCaseHash;
    if (!hashToUse && item) {
      const selectedTestCase = item.selectedTestCase;
      const testCaseToUse = selectedTestCase || (item.TestCases && Array.isArray(item.TestCases) && item.TestCases.length > 0 ? item.TestCases[0] : null);
      hashToUse = testCaseToUse?.Hash || testCaseToUse?.hash || null;
    }
    
    if (!hashToUse) {
      console.error("Test case hash is missing");
      alert("Не выбран тест-кейс для скачивания");
      return;
    }

    try {
      await datalayer.download_bug_archive(bugId, hashToUse);
    } catch (error) {
      console.error("Failed to download bug archive:", error);
      console.error("Error details:", error.message);
      alert("Ошибка при скачивании архива бага: " + error.message);
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
          position: 'relative',
        }}
      >
        {/* Кнопка переключения темы в правом верхнем углу */}
        <IconButton
          onClick={() => {
            if (setThemeMode) {
              setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
            }
          }}
          sx={{ 
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 1300,
            color: 'var(--text-neutral-primary)',
            backgroundColor: 'var(--surface-neutral-primary)',
            border: '1px solid var(--border-neutral-primary)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              backgroundColor: 'var(--surface-neutral-secondary)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }
          }}
          title={themeMode === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
        >
          {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>

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

                  {/* Общий аккордион для всех багов в формате "операция-id-хэш" */}
                  {(() => {
                    // Собираем все баги в плоский список с метками "операция-id-хэш"
                    const allBugs = [];
                    (item.bugs || []).forEach((bug) => {
                      const operation = bug.Operation || bug.operation || "Без операции";
                      
                      // Получаем первые 8 цифр folderId или ID бага
                      const rawId = bug.folderId || bug.FolderID;
                      let idPart = "unknown";
                      if (rawId !== undefined && rawId !== null) {
                        const idString = String(rawId);
                        const digitsOnly = idString.replace(/\D/g, "");
                        if (digitsOnly.length > 0) {
                          idPart = digitsOnly.substring(0, Math.min(8, digitsOnly.length));
                        }
                      } else {
                        const bugId = bug.ID || bug.id;
                        if (bugId !== undefined && bugId !== null) {
                          idPart = String(bugId);
                        }
                      }
                      
                      // Для каждого TestCase создаем отдельную запись
                      const tcList = Array.isArray(bug.TestCases) ? bug.TestCases : [];
                      if (tcList.length === 0) {
                        // Если нет TestCases, все равно добавляем баг
                        allBugs.push({
                          bug,
                          label: `${operation}-${idPart}-нет хэша`,
                          operation,
                          idPart,
                          hash: null,
                          testCase: null
                        });
                      } else {
                        tcList.forEach((tc) => {
                          const hash = tc.Hash || tc.hash || null;
                          const hashPart = hash || "нет хэша";
                          allBugs.push({
                            bug,
                            label: `${operation}-${idPart}-${hashPart}`,
                            operation,
                            idPart,
                            hash,
                            testCase: tc
                          });
                        });
                      }
                    });
                    
                    // Сортируем по операции, затем по id, затем по хэшу
                    allBugs.sort((a, b) => {
                      if (a.operation !== b.operation) {
                        return a.operation.localeCompare(b.operation);
                      }
                      if (a.idPart !== b.idPart) {
                        return a.idPart.localeCompare(b.idPart);
                      }
                      const hashA = a.hash || "";
                      const hashB = b.hash || "";
                      return hashA.localeCompare(hashB);
                    });
                    
                    return (
                      <Accordion
                        elevation={0}
                        square
                        sx={{
                          border: "1px solid var(--border-neutral-primary)",
                          "&:before": { display: "none" },
                          backgroundColor: 'var(--surface-neutral-primary)',
                        }}
                      >
                        <AccordionSummary
                          expandIcon={
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Chip
                                label={allBugs.length.toString()}
                                color="var(--chip-info-default)"
                                size="small"
                                sx={{ borderRadius: 999, mr: 2.5 }}
                              />
                              <ExpandMoreIcon className="MuiAccordionSummary-expandIcon" />
                            </Box>
                          }
                          sx={{
                            minHeight: 48,
                            paddingLeft: 0,
                            "& .MuiAccordionSummary-content": {
                              margin: 0,
                            },
                          }}
                        >
                          <Typography variant="fieldHeader">Баги</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List sx={{ py: 0 }}>
                            {allBugs.map((bugItem, idx) => {
                              return (
                                <ListItem key={`bug-${bugItem.bug.ID || bugItem.bug.id || idx}-${bugItem.hash || 'no-hash'}`} sx={{ py: 0.5 }}>
                                  <ListItemButton
                                    onClick={() => {
                                      const bugWithDatatype = { 
                                        ...bugItem.bug, 
                                        datatype: "bug", 
                                        selectedTestCase: bugItem.testCase 
                                      };
                                      tablistAppend(bugWithDatatype);
                                    }}
                                    sx={{ py: 0.5, minHeight: 36 }}
                                  >
                                    <ListItemText
                                      primary={
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                          {bugItem.label}
                                        </Typography>
                                      }
                                    />
                                  </ListItemButton>
                                </ListItem>
                              );
                            })}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    );
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
                    
                    // Получаем или создаем состояние для выбранных FS / режима вывода для этого бага
                    const bugKey = `bug-${item.ID || item.id || "unknown"}`;
                    const defaultFs = {
                      kind: "trace",
                      trace: { left: availableFsList[0] || "", right: availableFsList[1] || availableFsList[0] || "" },
                      stdout: { left: availableFsList[0] || "", right: availableFsList[1] || availableFsList[0] || "" },
                      stderr: { left: availableFsList[0] || "", right: availableFsList[1] || availableFsList[0] || "" },
                    };
                    const bugFsState = selectedFsForBugs[bugKey] || defaultFs;

                    const updateBugFs = (type, side, value) => {
                      // Особый случай: смена режима (trace/stdout/stderr)
                      if (type === "kind") {
                        setSelectedFsForBugs((prev) => ({
                          ...prev,
                          [bugKey]: {
                            ...(prev[bugKey] || defaultFs),
                            kind: value || "trace",
                          },
                        }));
                        return;
                      }

                      // Обновление выбранных FS для конкретного вида
                      setSelectedFsForBugs((prev) => ({
                        ...prev,
                        [bugKey]: {
                          ...(prev[bugKey] || defaultFs),
                          [type]: {
                            ...(prev[bugKey]?.[type] || defaultFs[type]),
                            [side]: value,
                          },
                        },
                      }));
                    };

                    const selectedFsTrace = bugFsState.trace || defaultFs.trace;
                    const selectedFsStdout = bugFsState.stdout || defaultFs.stdout;
                    const selectedFsStderr = bugFsState.stderr || defaultFs.stderr;
                    const currentKind = bugFsState.kind || "trace";
                    
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
                    
                    const bugId = item.ID || item.id;
                    const bugOperation = item.Operation || item.operation || "";
                    const bugTags = Array.isArray(item.tags) 
                      ? item.tags
                          .filter(tag => tag != null && tag !== '')
                          .map(tag => String(tag).trim())
                          .filter(tag => tag.length > 0)
                      : [];
                    const bugComment = item.comment !== undefined && item.comment !== null ? item.comment : "";
                    const selectedTestCase = item.selectedTestCase;
                    // Если selectedTestCase не указан, используем первый TestCase
                    const testCaseToUse = selectedTestCase || (item.TestCases && Array.isArray(item.TestCases) && item.TestCases.length > 0 ? item.TestCases[0] : null);
                    const testCaseHash = testCaseToUse?.Hash || testCaseToUse?.hash || null;
                    
                    // Функция для извлечения статистики из trace
                    const extractStatsFromTrace = (fsSummary) => {
                      if (!fsSummary || !fsSummary.FsTrace) return { success: 0, failure: 0, total: 0, totalExecutionTime: 0, returnCodes: [] };
                      
                      let traceData = fsSummary.FsTrace;
                      if (typeof traceData !== "string") {
                        if (traceData.String) {
                          traceData = traceData.String;
                        } else {
                          return { success: 0, failure: 0, total: 0, totalExecutionTime: 0, returnCodes: [] };
                        }
                      }
                      
                      try {
                        const parsed = JSON.parse(traceData);
                        let success = 0;
                        let failure = 0;
                        let totalExecutionTime = 0;
                        const returnCodes = [];
                        
                        if (parsed && parsed.rows && Array.isArray(parsed.rows)) {
                          parsed.rows.forEach(row => {
                            if (row.Success) {
                              success++;
                              if (row.Success.execution_time !== undefined) {
                                totalExecutionTime += row.Success.execution_time || 0;
                              }
                              if (row.Success.return_code !== undefined) {
                                returnCodes.push(row.Success.return_code);
                              }
                            }
                            if (row.Failure) {
                              failure++;
                              if (row.Failure.return_code !== undefined) {
                                returnCodes.push(row.Failure.return_code);
                              }
                            }
                          });
                          return { success, failure, total: success + failure, totalExecutionTime, returnCodes };
                        }
                        // Если есть поля success_n и failure_n
                        if (parsed.success_n !== undefined || parsed.failure_n !== undefined) {
                          return {
                            success: parsed.success_n || 0,
                            failure: parsed.failure_n || 0,
                            total: (parsed.success_n || 0) + (parsed.failure_n || 0),
                            totalExecutionTime: 0,
                            returnCodes: []
                          };
                        }
                      } catch (e) {
                        // Не JSON, возвращаем нули
                      }
                      
                      return { success: 0, failure: 0, total: 0, totalExecutionTime: 0, returnCodes: [] };
                    };

                    return (
                      <>
                        {/* Информация о баге, теги и комментарий */}
                        <Box sx={{ mt: 0, mb: 3, px: 3, width: "100%", backgroundColor: 'var(--surface-neutral-primary)' }}>
                          {/* Кнопки действий */}
                          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 3, pt: 2 }}>
                            <Button
                              variant="outlined"
                              startIcon={<DownloadIcon />}
                              onClick={() => handleDownloadBugArchive(bugId, testCaseHash, item)}
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
                              Скачать архив бага
                            </Button>
                          </Box>
                          <Box sx={{ display: "flex", mb: 2 }}>
                            {/* Левая колонка: ID/Operation */}
                            <Box sx={{ flex: 1.1, mr: 6 }}>
                              {/* ID бага */}
                              <Box sx={{ display: "flex", mb: 1 }}>
                                <Typography
                                  variant="fieldHeader"
                                  sx={{ width: 220 }}
                                >
                                  ID бага:
                                </Typography>
                                <Typography variant="fieldValue">
                                  {bugId || "N/A"}
                                </Typography>
                              </Box>

                              {/* Operation */}
                              {bugOperation && (
                                <Box sx={{ display: "flex", mb: 1 }}>
                                  <Typography
                                    variant="fieldHeader"
                                    sx={{ width: 220 }}
                                  >
                                    Операция:
                                  </Typography>
                                  <Typography variant="fieldValue">
                                    {bugOperation}
                                  </Typography>
                                </Box>
                              )}

                              {/* Полезная информация о баге */}
                              {testCaseToUse && (
                                <>
                                  {/* Total Operations */}
                                  {testCaseToUse.TotalOperations !== undefined && testCaseToUse.TotalOperations > 0 && (
                                    <Box sx={{ display: "flex", mb: 1 }}>
                                      <Typography
                                        variant="fieldHeader"
                                        sx={{ width: 220 }}
                                      >
                                        Всего операций:
                                      </Typography>
                                      <Typography variant="fieldValue">
                                        {testCaseToUse.TotalOperations}
                                      </Typography>
                                    </Box>
                                  )}

                                  {/* Hash */}
                                  {testCaseToUse.Hash && (
                                    <Box sx={{ display: "flex", mb: 1 }}>
                                      <Typography
                                        variant="fieldHeader"
                                        sx={{ width: 220 }}
                                      >
                                        Hash:
                                      </Typography>
                                      <Typography variant="fieldValue" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                        {testCaseToUse.Hash}
                                      </Typography>
                                    </Box>
                                  )}

                                  {/* Статистика по FS */}
                                  {testCaseToUse.FSSummaries && Array.isArray(testCaseToUse.FSSummaries) && testCaseToUse.FSSummaries.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                      <Typography
                                        variant="fieldHeader"
                                        sx={{ mb: 1 }}
                                      >
                                      </Typography>
                                      {testCaseToUse.FSSummaries.map((fs, idx) => {
                                        // Пробуем получить данные из полей или извлечь из trace
                                        let successCount = fs.FsSuccessCount || 0;
                                        let failureCount = fs.FsFailureCount || 0;
                                        
                                        // Извлекаем статистику из trace
                                        const stats = extractStatsFromTrace(fs);
                                        
                                        // Если данные нули, используем извлеченные из trace
                                        if (successCount === 0 && failureCount === 0) {
                                          successCount = stats.success;
                                          failureCount = stats.failure;
                                        }
                                        
                                        const totalOps = successCount + failureCount;
                                        
                                        // Время выполнения: сначала из trace, потом из БД
                                        let totalExecutionTime = stats.totalExecutionTime;
                                        if (totalExecutionTime === 0) {
                                          const executionTime = fs.FsExecutionTime;
                                          if (executionTime && executionTime.Valid) {
                                            totalExecutionTime = executionTime.Microseconds || 0;
                                          }
                                        }
                                        
                                        let timeStr = "N/A";
                                        if (totalExecutionTime > 0) {
                                          const ms = Math.round(totalExecutionTime / 1000);
                                          if (ms > 0) {
                                            timeStr = `${ms} мс`;
                                          } else {
                                            timeStr = `${totalExecutionTime} мкс`;
                                          }
                                        }
                                        
                                        // Коды возврата из trace
                                        const returnCodes = stats.returnCodes;
                                        const uniqueReturnCodes = [...new Set(returnCodes)].sort((a, b) => a - b);

                                        return (
                                          <Box key={`fs-stats-${idx}`} sx={{ mb: 1.5, p: 1.5, backgroundColor: 'var(--surface-neutral-secondary)', borderRadius: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                              {fs.FsName || `FS ${idx + 1}`}
                                            </Typography>
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                                              <Box>
                                                <Typography variant="body2" sx={{ color: 'var(--text-neutral-secondary)', fontSize: '0.75rem' }}>
                                                  Успешных операций
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'var(--text-success)', fontWeight: 600 }}>
                                                  {successCount}
                                                </Typography>
                                              </Box>
                                              <Box>
                                                <Typography variant="body2" sx={{ color: 'var(--text-neutral-secondary)', fontSize: '0.75rem' }}>
                                                  Неудачных операций
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'var(--text-error)', fontWeight: 600 }}>
                                                  {failureCount}
                                                </Typography>
                                              </Box>
                                              {totalOps > 0 && (
                                                <Box>
                                                  <Typography variant="body2" sx={{ color: 'var(--text-neutral-secondary)', fontSize: '0.75rem' }}>
                                                    Успешность
                                                  </Typography>
                                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {Math.round((successCount / totalOps) * 100)}%
                                                  </Typography>
                                                </Box>
                                              )}
                                              {timeStr !== "N/A" && (
                                                <Box>
                                                  <Typography variant="body2" sx={{ color: 'var(--text-neutral-secondary)', fontSize: '0.75rem' }}>
                                                    Время выполнения
                                                  </Typography>
                                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {timeStr}
                                                  </Typography>
                                                </Box>
                                              )}
                                            </Box>
                                          </Box>
                                        );
                                      })}
                                    </Box>
                                  )}
                                </>
                              )}
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
                                    const safeTags = bugTags;
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
                                            console.log("Bug Autocomplete onChange:", { newValue, reason, bugId });
                                            if (!bugId) {
                                              console.error("Bug ID is missing");
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
                                            
                                            console.log("Saving bug tags:", stringTags);
                                            await handleBugTagsChange(bugId, stringTags);
                                          } catch (error) {
                                            console.error("Error in bug onChange:", error);
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
                                                  key={`bug-tag-${bugId}-${index}-${label}`}
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
                                    console.error("Error rendering bug Autocomplete:", e, e.stack);
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
                                  {editingComments[`bug-${bugId}`] ? (
                                    <TextField
                                      size="small"
                                      variant="outlined"
                                      fullWidth
                                      placeholder="Комментарий (Enter для сохранения, Shift+Enter для новой строки)"
                                      value={bugComment}
                                      inputRef={(ref) => {
                                        if (ref) {
                                          commentRefs.current[`bug-${bugId}`] = ref;
                                        }
                                      }}
                                      onChange={(e) => {
                                        const newValue = e.target.value;
                                        setTablist(prevTablist => prevTablist.map(tab =>
                                          tab.datatype === "bug" && (tab.ID === bugId || tab.id === bugId) 
                                            ? { ...tab, comment: newValue } 
                                            : tab
                                        ));
                                        if (commentRefs.current[`bug-${bugId}`]) {
                                          commentRefs.current[`bug-${bugId}`].value = newValue;
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                          e.preventDefault();
                                          handleBugCommentChange(bugId, bugComment);
                                        }
                                      }}
                                      onBlur={() => {
                                        handleBugCommentChange(bugId, bugComment);
                                      }}
                                      multiline
                                      rows={2}
                                    />
                                  ) : (
                                    <Box
                                      onClick={() => handleBugCommentClick(bugId)}
                                      sx={{
                                        p: 1.5,
                                        minHeight: 40,
                                        border: "1px solid transparent",
                                        borderRadius: 1,
                                        cursor: "text",
                                        backgroundColor: bugComment ? 'var(--surface-neutral-secondary)' : 'transparent',
                                        "&:hover": {
                                          borderColor: "var(--border-neutral-secondary)",
                                          backgroundColor: 'var(--surface-neutral-secondary)',
                                        },
                                      }}
                                    >
                                      {bugComment ? (
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            whiteSpace: "pre-wrap",
                                            wordBreak: "break-word",
                                            color: "var(--text-neutral-primary)",
                                          }}
                                        >
                                          {bugComment}
                                        </Typography>
                                      ) : (
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            color: "var(--text-neutral-secondary)",
                                            fontStyle: "italic",
                                          }}
                                        >
                                          Нажмите, чтобы добавить комментарий...
                                        </Typography>
                                      )}
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        </Box>

                        {/* Аккордион для test.json */}
                  {item.TestCases && item.TestCases.length > 0 && (() => {
                    const testDataRaw = item.TestCases[0]?.Test;
                    let testDataStr = '';
                    if (testDataRaw) {
                      if (typeof testDataRaw === 'string') {
                        testDataStr = testDataRaw;
                      } else if (testDataRaw.String) {
                        testDataStr = testDataRaw.String;
                      } else {
                        try {
                          testDataStr = JSON.stringify(testDataRaw, null, 2);
                        } catch (e) {
                          testDataStr = String(testDataRaw);
                        }
                      }
                    }
                    
                    // Парсим JSON для табличного вида
                    let parsedTest = null;
                    try {
                      if (testDataStr) {
                        parsedTest = JSON.parse(testDataStr);
                      } else if (testDataRaw) {
                        // Если testDataRaw уже объект
                        if (typeof testDataRaw === 'object' && !testDataRaw.String) {
                          parsedTest = testDataRaw;
                        } else if (testDataRaw.String) {
                          parsedTest = JSON.parse(testDataRaw.String);
                        }
                      }
                      console.log("Parsed test data:", { parsedTest, isArray: Array.isArray(parsedTest), type: typeof parsedTest });
                    } catch (e) {
                      console.error("Error parsing test data:", e, { testDataStr, testDataRaw });
                      parsedTest = null;
                    }
                    
                    // Состояние для выбора режима отображения
                    const itemId = item.ID || item.id || 'unknown';
                    const testViewKey = `test-view-${itemId}`;
                    
                    // Инициализируем режим из localStorage или используем сохраненный
                    const getInitialMode = () => {
                      if (testViewModes[itemId]) {
                        return testViewModes[itemId];
                      }
                      const saved = localStorage.getItem(testViewKey);
                      return saved === 'table' ? 'table' : 'json';
                    };
                    
                    const testViewMode = testViewModes[itemId] || getInitialMode();
                    
                    const handleTestViewChange = (event, newMode) => {
                      if (newMode !== null) {
                        setTestViewModes(prev => ({ ...prev, [itemId]: newMode }));
                        localStorage.setItem(testViewKey, newMode);
                      }
                    };
                    
                    // Функция для отображения значения параметра
                    const formatParamValue = (value) => {
                      if (value === null || value === undefined) return '';
                      if (typeof value === 'object') {
                        if (Array.isArray(value)) {
                          // Если массив объектов, пытаемся извлечь значения
                          if (value.length > 0 && typeof value[0] === 'object') {
                            // Если это массив объектов, пробуем найти общие поля или просто показываем количество
                            return `[${value.length} элементов]`;
                          }
                          return value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(',');
                        }
                        // Для объектов пытаемся найти простые значения
                        const objKeys = Object.keys(value);
                        if (objKeys.length === 0) return '{}';
                        // Если объект простой (все значения примитивные), показываем их
                        const simpleValues = objKeys.map(k => `${k}: ${value[k]}`).join(', ');
                        if (simpleValues.length < 100) {
                          return simpleValues;
                        }
                        return JSON.stringify(value);
                      }
                      return String(value);
                    };
                    
                    // Функция для рендеринга табличного вида
                    const renderTableView = () => {
                      if (!parsedTest) {
                        return <Typography sx={{ p: 2, color: 'var(--text-neutral-secondary)' }}>Нет данных для табличного отображения</Typography>;
                      }
                      
                      // Если это не массив, пробуем найти массив внутри объекта
                      let operations = null;
                      if (Array.isArray(parsedTest)) {
                        operations = parsedTest;
                      } else if (parsedTest.ops && Array.isArray(parsedTest.ops)) {
                        operations = parsedTest.ops;
                      } else if (parsedTest.operations && Array.isArray(parsedTest.operations)) {
                        operations = parsedTest.operations;
                      } else if (parsedTest.rows && Array.isArray(parsedTest.rows)) {
                        operations = parsedTest.rows;
                      } else if (typeof parsedTest === 'object') {
                        // Если это объект с одной операцией, оборачиваем в массив
                        operations = [parsedTest];
                      }
                      
                      if (!operations || !Array.isArray(operations) || operations.length === 0) {
                        return <Typography sx={{ p: 2, color: 'var(--text-neutral-secondary)' }}>Нет данных для табличного отображения (структура: {JSON.stringify(Object.keys(parsedTest || {}))})</Typography>;
                      }
                      
                      return (
                        <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                          <Table size="small" sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid var(--border-neutral-primary)', fontSize: '0.875rem' } }}>
                            <TableBody>
                              {operations.map((operation, idx) => {
                                if (!operation || typeof operation !== 'object') return null;
                                
                                // Определяем тип операции
                                // Возможно, структура такая: { "MKDIR": { path: "...", mode: "..." } }
                                // или { "SETXATTR": { path: "...", name: "..." } }
                                // Т.е. название операции - это ключ объекта
                                
                                let opType = null;
                                let operationParams = operation;
                                
                                // Список известных названий операций
                                const knownOps = [
                                  'MKDIR', 'OPEN', 'CREATE', 'CLOSE', 'READ', 'WRITE', 'PREAD', 'PWRITE',
                                  'LSEEK', 'TRUNCATE', 'FTRUNCATE', 'RENAME', 'UNLINK', 'SYMLINK', 'HARDLINK',
                                  'CHMOD', 'FCHMOD', 'CHMODAT', 'FCHMODAT', 'MKDIRAT',
                                  'SETXATTR', 'GETXATTR', 'LISTXATTR', 'REMOVEXATTR',
                                  'FSYNC', 'FSTAT', 'STAT', 'FSTATAT', 'LINKAT', 'HARDLINKAT'
                                ];
                                
                                // Проверяем, является ли один из ключей названием операции
                                const keys = Object.keys(operation);
                                const foundOpKey = keys.find(key => knownOps.includes(key.toUpperCase()) || knownOps.includes(key));
                                
                                if (foundOpKey) {
                                  // Название операции - это ключ объекта
                                  opType = foundOpKey;
                                  operationParams = operation[foundOpKey] || {};
                                } else {
                                  // Пытаемся найти в стандартных полях
                                  if (operation.operation) {
                                    opType = operation.operation;
                                  } else if (operation.Operation) {
                                    opType = operation.Operation;
                                  } else if (operation.type) {
                                    opType = operation.type;
                                  } else if (operation.Type) {
                                    opType = operation.Type;
                                  } else if (operation.op) {
                                    opType = operation.op;
                                  } else if (operation.Op) {
                                    opType = operation.Op;
                                  } else {
                                    // Пытаемся определить по структуре или параметрам
                                    if (operation.Success && operation.Success.operation) {
                                      opType = operation.Success.operation;
                                    } else if (operation.Failure && operation.Failure.operation) {
                                      opType = operation.Failure.operation;
                                    } else {
                                      // Логируем для отладки
                                      if (idx < 3) {
                                        console.log(`Operation ${idx} structure:`, operation, "Keys:", keys);
                                      }
                                      // Пробуем определить по наличию специфичных параметров
                                      if (keys.includes('path') && keys.includes('mode')) {
                                        opType = 'MKDIR';
                                      } else if (keys.includes('path') && keys.includes('name')) {
                                        opType = 'SETXATTR';
                                      } else if (keys.includes('src_offset') && keys.includes('size')) {
                                        opType = 'PREAD';
                                      } else {
                                        opType = 'UNKNOWN';
                                      }
                                    }
                                  }
                                }
                                
                                // Получаем все параметры операции
                                // Если operationParams - это объект с параметрами, используем его ключи
                                const params = operationParams && typeof operationParams === 'object' 
                                  ? Object.keys(operationParams).filter(key => {
                                      // Исключаем служебные поля
                                      const excludeFields = ['operation', 'Operation', 'type', 'Type', 'op', 'Op', 'Success', 'Failure'];
                                      return !excludeFields.includes(key);
                                    })
                                  : Object.keys(operation).filter(key => {
                                      const excludeFields = ['operation', 'Operation', 'type', 'Type', 'op', 'Op', 'Success', 'Failure'];
                                      return !excludeFields.includes(key) && !knownOps.includes(key.toUpperCase()) && !knownOps.includes(key);
                                    });
                                
                                return (
                                  <React.Fragment key={`op-${idx}`}>
                                    {/* Строка с названием операции */}
                                    <TableRow>
                                      <TableCell colSpan={2} sx={{ fontWeight: 600, backgroundColor: 'var(--surface-neutral-secondary)', pt: 1.5, pb: 1 }}>
                                        {opType}
                                      </TableCell>
                                    </TableRow>
                                    {/* Строки с параметрами */}
                                    {params.length > 0 ? (
                                      params.map((paramKey) => {
                                        const paramValue = operationParams && typeof operationParams === 'object' 
                                          ? operationParams[paramKey] 
                                          : operation[paramKey];
                                        // Если значение - объект, разворачиваем его в отдельные строки
                                        if (paramValue && typeof paramValue === 'object' && !Array.isArray(paramValue)) {
                                          const subParams = Object.keys(paramValue);
                                          if (subParams.length > 0) {
                                            return (
                                              <React.Fragment key={`op-${idx}-param-${paramKey}`}>
                                                {subParams.map((subKey) => (
                                                  <TableRow key={`op-${idx}-param-${paramKey}-${subKey}`}>
                                                    <TableCell sx={{ width: '200px', fontWeight: 500, pl: 4 }}>{subKey}</TableCell>
                                                    <TableCell sx={{ fontFamily: 'monospace' }}>{formatParamValue(paramValue[subKey])}</TableCell>
                                                  </TableRow>
                                                ))}
                                              </React.Fragment>
                                            );
                                          }
                                        }
                                        return (
                                          <TableRow key={`op-${idx}-param-${paramKey}`}>
                                            <TableCell sx={{ width: '200px', fontWeight: 500 }}>{paramKey}</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace' }}>{formatParamValue(paramValue)}</TableCell>
                                          </TableRow>
                                        );
                                      })
                                    ) : (
                                      <TableRow>
                                        <TableCell colSpan={2} sx={{ color: 'var(--text-neutral-secondary)', fontStyle: 'italic' }}>
                                          Нет параметров
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </Box>
                      );
                    };
                    
                    const isFullscreenOpen = testFullscreenOpen[itemId] || false;
                    const handleFullscreenOpen = () => {
                      setTestFullscreenOpen(prev => ({ ...prev, [itemId]: true }));
                    };
                    const handleFullscreenClose = () => {
                      setTestFullscreenOpen(prev => ({ ...prev, [itemId]: false }));
                    };
                    
                    return (
                      <>
                        <Accordion defaultExpanded elevation={0} square sx={{ mb: 2, border: '1px solid var(--border-neutral-primary)', "&:before": { display: "none" } }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mr: 2 }}>
                              <Typography variant="fieldHeader">test.json</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {testViewMode === 'table' && (
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFullscreenOpen();
                                    }}
                                    sx={{ ml: 1 }}
                                  >
                                    <FullscreenIcon fontSize="small" />
                                  </IconButton>
                                )}
                                <ToggleButtonGroup
                                  value={testViewMode}
                                  exclusive
                                  onChange={handleTestViewChange}
                                  size="small"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ToggleButton value="json">JSON</ToggleButton>
                                  <ToggleButton value="table">Таблица</ToggleButton>
                                </ToggleButtonGroup>
                              </Box>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            {testViewMode === 'table' ? (
                              renderTableView()
                            ) : (
                              <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                                <pre style={{ margin: 0, padding: '1em', backgroundColor: 'var(--surface-neutral-secondary)', borderRadius: '4px', fontSize: '0.875rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                  {testDataStr || 'Нет данных'}
                                </pre>
                              </Box>
                            )}
                          </AccordionDetails>
                        </Accordion>
                        
                        {/* Полноэкранный диалог для таблицы */}
                        <Dialog
                          open={isFullscreenOpen}
                          onClose={handleFullscreenClose}
                          maxWidth={false}
                          fullWidth
                          PaperProps={{
                            sx: {
                              width: '95vw',
                              height: '95vh',
                              maxWidth: 'none',
                              maxHeight: 'none',
                              m: 2
                            }
                          }}
                        >
                          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">test.json - Таблица</Typography>
                            <IconButton onClick={handleFullscreenClose}>
                              <FullscreenExitIcon />
                            </IconButton>
                          </DialogTitle>
                          <DialogContent sx={{ p: 0, overflow: 'auto', height: '100%' }}>
                            <Box sx={{ width: '100%', height: '100%' }}>
                              {(() => {
                                // Создаем версию таблицы для полноэкранного режима с растянутыми колонками
                                if (!parsedTest) {
                                  return <Typography sx={{ p: 2, color: 'var(--text-neutral-secondary)' }}>Нет данных для табличного отображения</Typography>;
                                }
                                
                                let operations = null;
                                if (Array.isArray(parsedTest)) {
                                  operations = parsedTest;
                                } else if (parsedTest.ops && Array.isArray(parsedTest.ops)) {
                                  operations = parsedTest.ops;
                                } else if (parsedTest.operations && Array.isArray(parsedTest.operations)) {
                                  operations = parsedTest.operations;
                                } else if (parsedTest.rows && Array.isArray(parsedTest.rows)) {
                                  operations = parsedTest.rows;
                                } else if (typeof parsedTest === 'object') {
                                  operations = [parsedTest];
                                }
                                
                                if (!operations || !Array.isArray(operations) || operations.length === 0) {
                                  return <Typography sx={{ p: 2, color: 'var(--text-neutral-secondary)' }}>Нет данных для табличного отображения</Typography>;
                                }
                                
                                return (
                                  <Table size="small" sx={{ width: '100%', '& .MuiTableCell-root': { borderBottom: '1px solid var(--border-neutral-primary)', fontSize: '0.875rem' } }}>
                                    <colgroup>
                                      <col style={{ width: '20%' }} />
                                      <col style={{ width: '80%' }} />
                                    </colgroup>
                                    <TableBody>
                                      {operations.map((operation, idx) => {
                                        if (!operation || typeof operation !== 'object') return null;
                                        
                                        let opType = null;
                                        let operationParams = operation;
                                        
                                        const knownOps = [
                                          'MKDIR', 'OPEN', 'CREATE', 'CLOSE', 'READ', 'WRITE', 'PREAD', 'PWRITE',
                                          'LSEEK', 'TRUNCATE', 'FTRUNCATE', 'RENAME', 'UNLINK', 'SYMLINK', 'HARDLINK',
                                          'CHMOD', 'FCHMOD', 'CHMODAT', 'FCHMODAT', 'MKDIRAT',
                                          'SETXATTR', 'GETXATTR', 'LISTXATTR', 'REMOVEXATTR',
                                          'FSYNC', 'FSTAT', 'STAT', 'FSTATAT', 'LINKAT', 'HARDLINKAT'
                                        ];
                                        
                                        const keys = Object.keys(operation);
                                        const foundOpKey = keys.find(key => knownOps.includes(key.toUpperCase()) || knownOps.includes(key));
                                        
                                        if (foundOpKey) {
                                          opType = foundOpKey;
                                          operationParams = operation[foundOpKey] || {};
                                        } else {
                                          if (operation.operation) {
                                            opType = operation.operation;
                                          } else if (operation.Operation) {
                                            opType = operation.Operation;
                                          } else if (operation.type) {
                                            opType = operation.type;
                                          } else if (operation.Type) {
                                            opType = operation.Type;
                                          } else if (operation.op) {
                                            opType = operation.op;
                                          } else if (operation.Op) {
                                            opType = operation.Op;
                                          } else {
                                            if (operation.Success && operation.Success.operation) {
                                              opType = operation.Success.operation;
                                            } else if (operation.Failure && operation.Failure.operation) {
                                              opType = operation.Failure.operation;
                                            } else {
                                              const keys = Object.keys(operation);
                                              if (keys.includes('path') && keys.includes('mode')) {
                                                opType = 'MKDIR';
                                              } else if (keys.includes('path') && keys.includes('name')) {
                                                opType = 'SETXATTR';
                                              } else if (keys.includes('src_offset') && keys.includes('size')) {
                                                opType = 'PREAD';
                                              } else {
                                                opType = 'UNKNOWN';
                                              }
                                            }
                                          }
                                        }
                                        
                                        const params = operationParams && typeof operationParams === 'object' 
                                          ? Object.keys(operationParams).filter(key => {
                                              const excludeFields = ['operation', 'Operation', 'type', 'Type', 'op', 'Op', 'Success', 'Failure'];
                                              return !excludeFields.includes(key);
                                            })
                                          : Object.keys(operation).filter(key => {
                                              const excludeFields = ['operation', 'Operation', 'type', 'Type', 'op', 'Op', 'Success', 'Failure'];
                                              return !excludeFields.includes(key) && !knownOps.includes(key.toUpperCase()) && !knownOps.includes(key);
                                            });
                                        
                                        return (
                                          <React.Fragment key={`op-${idx}`}>
                                            <TableRow>
                                              <TableCell colSpan={2} sx={{ fontWeight: 600, backgroundColor: 'var(--surface-neutral-secondary)', pt: 1.5, pb: 1 }}>
                                                {opType}
                                              </TableCell>
                                            </TableRow>
                                            {params.length > 0 ? (
                                              params.map((paramKey) => {
                                                const paramValue = operationParams && typeof operationParams === 'object' 
                                                  ? operationParams[paramKey] 
                                                  : operation[paramKey];
                                                if (paramValue && typeof paramValue === 'object' && !Array.isArray(paramValue)) {
                                                  const subParams = Object.keys(paramValue);
                                                  if (subParams.length > 0) {
                                                    return (
                                                      <React.Fragment key={`op-${idx}-param-${paramKey}`}>
                                                        {subParams.map((subKey) => (
                                                          <TableRow key={`op-${idx}-param-${paramKey}-${subKey}`}>
                                                            <TableCell sx={{ width: '20%', fontWeight: 500, pl: 4 }}>{subKey}</TableCell>
                                                            <TableCell sx={{ fontFamily: 'monospace', width: '80%' }}>{formatParamValue(paramValue[subKey])}</TableCell>
                                                          </TableRow>
                                                        ))}
                                                      </React.Fragment>
                                                    );
                                                  }
                                                }
                                                return (
                                                  <TableRow key={`op-${idx}-param-${paramKey}`}>
                                                    <TableCell sx={{ width: '20%', fontWeight: 500 }}>{paramKey}</TableCell>
                                                    <TableCell sx={{ fontFamily: 'monospace', width: '80%' }}>{formatParamValue(paramValue)}</TableCell>
                                                  </TableRow>
                                                );
                                              })
                                            ) : (
                                              <TableRow>
                                                <TableCell colSpan={2} sx={{ color: 'var(--text-neutral-secondary)', fontStyle: 'italic' }}>
                                                  Нет параметров
                                                </TableCell>
                                              </TableRow>
                                            )}
                                          </React.Fragment>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                );
                              })()}
                            </Box>
                          </DialogContent>
                        </Dialog>
                      </>
                    );
                  })()}

                        {/* Единый аккордион для вывода (trace / stdout / stderr) */}
                        {item.TestCases && item.TestCases.length > 0 && availableFsList.length >= 1 && (
                          <Accordion
                            elevation={0}
                            square
                            sx={{ mb: 2, border: "1px solid var(--border-neutral-primary)", "&:before": { display: "none" } }}
                          >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mr: 2 }}>
                                <Typography variant="fieldHeader">Diff</Typography>
                                {(() => {
                                  // Определяем, является ли файл JSON (trace.json)
                                  const isJsonFile = currentKind === "trace";
                                  if (!isJsonFile) return null;
                                  
                                  const bugId = item.ID || item.id || 'unknown';
                                  const diffViewKey = `${bugId}-${currentKind}`;
                                  const diffViewMode = diffViewModes[diffViewKey] || 'diff';
                                  const isFullscreenOpen = diffFullscreenOpen[diffViewKey] || false;
                                  
                                  return (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      {diffViewMode === 'table' && (
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDiffFullscreenOpen(prev => ({ ...prev, [diffViewKey]: true }));
                                          }}
                                          sx={{ ml: 1 }}
                                        >
                                          <FullscreenIcon fontSize="small" />
                                        </IconButton>
                                      )}
                                      <ToggleButtonGroup
                                        value={diffViewMode}
                                        exclusive
                                        onChange={(e, newMode) => {
                                          if (newMode !== null) {
                                            setDiffViewModes(prev => ({ ...prev, [diffViewKey]: newMode }));
                                          }
                                        }}
                                        size="small"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ToggleButton value="diff">Diff</ToggleButton>
                                        <ToggleButton value="table">Таблица</ToggleButton>
                                      </ToggleButtonGroup>
                                    </Box>
                                  );
                                })()}
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Stack spacing={2}>
                                <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                                  <FormControl size="small" sx={{ minWidth: 160 }}>
                                    <InputLabel>Файл</InputLabel>
                                    <Select
                                      value={currentKind}
                                      label="Файл"
                                      onChange={(e) => updateBugFs("kind", "value", e.target.value)}
                                    >
                                      <MenuItem value="trace">trace</MenuItem>
                                      <MenuItem value="stdout">stdout</MenuItem>
                                      <MenuItem value="stderr">stderr</MenuItem>
                                    </Select>
                                  </FormControl>

                                  {availableFsList.length >= 1 && (
                                    <>
                                      <FormControl size="small" sx={{ minWidth: 120 }}>
                                        <InputLabel>FS (слева)</InputLabel>
                                        <Select
                                          value={
                                            currentKind === "stdout"
                                              ? selectedFsStdout.left
                                              : currentKind === "stderr"
                                              ? selectedFsStderr.left
                                              : selectedFsTrace.left
                                          }
                                          label="FS (слева)"
                                          onChange={(e) =>
                                            updateBugFs(
                                              currentKind === "stdout"
                                                ? "stdout"
                                                : currentKind === "stderr"
                                                ? "stderr"
                                                : "trace",
                                              "left",
                                              e.target.value
                                            )
                                          }
                                        >
                                          {availableFsList.map((fs) => (
                                            <MenuItem key={fs} value={fs}>
                                              {fs}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                      {availableFsList.length >= 2 && (
                                        <>
                                          <Typography
                                            variant="body2"
                                            sx={{ color: "var(--text-neutral-secondary)" }}
                                          >
                                            vs
                                          </Typography>
                                          <FormControl size="small" sx={{ minWidth: 120 }}>
                                            <InputLabel>FS (справа)</InputLabel>
                                            <Select
                                              value={
                                                currentKind === "stdout"
                                                  ? selectedFsStdout.right
                                                  : currentKind === "stderr"
                                                  ? selectedFsStderr.right
                                                  : selectedFsTrace.right
                                              }
                                              label="FS (справа)"
                                              onChange={(e) =>
                                                updateBugFs(
                                                  currentKind === "stdout"
                                                    ? "stdout"
                                                    : currentKind === "stderr"
                                                    ? "stderr"
                                                    : "trace",
                                                  "right",
                                                  e.target.value
                                                )
                                              }
                                            >
                                              {availableFsList.map((fs) => (
                                                <MenuItem key={fs} value={fs}>
                                                  {fs}
                                                </MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        </>
                                      )}
                                    </>
                                  )}
                                </Box>

                                {(() => {
                                  const tc0 = item.TestCases[0];

                                  let leftRaw = "";
                                  let rightRaw = "";

                                  if (currentKind === "trace") {
                                    const fsLeft = getFsSummary(
                                      tc0,
                                      selectedFsTrace.left || availableFsList[0]
                                    );
                                    const fsRight = getFsSummary(
                                      tc0,
                                      selectedFsTrace.right || selectedFsTrace.left || availableFsList[0]
                                    );
                                    const traceLeft = getTraceData(fsLeft);
                                    const traceRight = getTraceData(fsRight);
                                    leftRaw = traceLeft || "";
                                    rightRaw = traceRight || "";
                                  } else if (currentKind === "stdout") {
                                    const fsLeftName = selectedFsStdout.left || availableFsList[0];
                                    const fsRightName = selectedFsStdout.right || selectedFsStdout.left || availableFsList[0];
                                    
                                    const fsLeft = getFsSummary(tc0, fsLeftName);
                                    const fsRight = getFsSummary(tc0, fsRightName);
                                    
                                    if (fsLeft) {
                                      const stdout = fsLeft.stdout || fsLeft.Stdout;
                                      if (stdout !== undefined && stdout !== null) {
                                        leftRaw = typeof stdout === "string" ? stdout : (stdout.String || String(stdout));
                                      }
                                    }
                                    
                                    if (fsRight) {
                                      const stdout = fsRight.stdout || fsRight.Stdout;
                                      if (stdout !== undefined && stdout !== null) {
                                        rightRaw = typeof stdout === "string" ? stdout : (stdout.String || String(stdout));
                                      }
                                    }
                                  } else if (currentKind === "stderr") {
                                    const fsLeftName = selectedFsStderr.left || availableFsList[0];
                                    const fsRightName = selectedFsStderr.right || selectedFsStderr.left || availableFsList[0];
                                    
                                    const fsLeft = getFsSummary(tc0, fsLeftName);
                                    const fsRight = getFsSummary(tc0, fsRightName);
                                    
                                    if (fsLeft) {
                                      const stderr = fsLeft.stderr || fsLeft.Stderr;
                                      if (stderr !== undefined && stderr !== null) {
                                        leftRaw = typeof stderr === "string" ? stderr : (stderr.String || String(stderr));
                                      }
                                    }
                                    
                                    if (fsRight) {
                                      const stderr = fsRight.stderr || fsRight.Stderr;
                                      if (stderr !== undefined && stderr !== null) {
                                        rightRaw = typeof stderr === "string" ? stderr : (stderr.String || String(stderr));
                                      }
                                    }
                                  }

                                  let leftText = normalizeForDiff(leftRaw);
                                  let rightText = normalizeForDiff(rightRaw);
                                  
                                  // Нормализуем количество строк для правильного выравнивания в diff
                                  // Убираем trailing newlines перед подсчетом
                                  const leftTrimmed = leftText.replace(/\n+$/, '');
                                  const rightTrimmed = rightText.replace(/\n+$/, '');
                                  
                                  const leftLines = leftTrimmed.split('\n').length;
                                  const rightLines = rightTrimmed.split('\n').length;
                                  const maxLines = Math.max(leftLines, rightLines);
                                  
                                  // Добавляем пустые строки в конец, чтобы выровнять количество строк
                                  if (leftLines < maxLines) {
                                    leftText = leftTrimmed + '\n'.repeat(maxLines - leftLines);
                                  } else {
                                    leftText = leftTrimmed;
                                  }
                                  
                                  if (rightLines < maxLines) {
                                    rightText = rightTrimmed + '\n'.repeat(maxLines - rightLines);
                                  } else {
                                    rightText = rightTrimmed;
                                  }

                                  // Проверяем, нужно ли показывать табличный вид для JSON файлов
                                  const bugId = item.ID || item.id || 'unknown';
                                  const diffViewKey = `${bugId}-${currentKind}`;
                                  const diffViewMode = diffViewModes[diffViewKey] || 'diff';
                                  const isJsonFile = currentKind === "trace";
                                  
                                  if (isJsonFile && diffViewMode === 'table') {
                                    // Парсим JSON для табличного вида
                                    let leftParsed = null;
                                    let rightParsed = null;
                                    
                                    try {
                                      if (leftRaw) {
                                        leftParsed = JSON.parse(leftRaw);
                                      }
                                    } catch (e) {
                                      console.error("Error parsing left JSON:", e);
                                    }
                                    
                                    try {
                                      if (rightRaw) {
                                        rightParsed = JSON.parse(rightRaw);
                                      }
                                    } catch (e) {
                                      console.error("Error parsing right JSON:", e);
                                    }
                                    
                                    // Функция для рендеринга таблицы из JSON
                                    const renderJsonTable = (parsed, label) => {
                                      if (!parsed) {
                                        return (
                                          <Box sx={{ p: 2, color: 'var(--text-neutral-secondary)' }}>
                                            {label}: Нет данных
                                          </Box>
                                        );
                                      }
                                      
                                      // Для trace.json структура: { rows: [...] }
                                      let operations = null;
                                      if (parsed.rows && Array.isArray(parsed.rows)) {
                                        operations = parsed.rows;
                                      } else if (parsed.ops && Array.isArray(parsed.ops)) {
                                        operations = parsed.ops;
                                      } else if (Array.isArray(parsed)) {
                                        operations = parsed;
                                      } else {
                                        operations = [parsed];
                                      }
                                      
                                      if (!operations || operations.length === 0) {
                                        return (
                                          <Box sx={{ p: 2, color: 'var(--text-neutral-secondary)' }}>
                                            {label}: Нет данных
                                          </Box>
                                        );
                                      }
                                      
                                      const knownOps = [
                                        'MKDIR', 'OPEN', 'CREATE', 'CLOSE', 'READ', 'WRITE', 'PREAD', 'PWRITE',
                                        'LSEEK', 'TRUNCATE', 'FTRUNCATE', 'RENAME', 'UNLINK', 'SYMLINK', 'HARDLINK',
                                        'CHMOD', 'FCHMOD', 'CHMODAT', 'FCHMODAT', 'MKDIRAT',
                                        'SETXATTR', 'GETXATTR', 'LISTXATTR', 'REMOVEXATTR',
                                        'FSYNC', 'FSTAT', 'STAT', 'FSTATAT', 'LINKAT', 'HARDLINKAT'
                                      ];
                                      
                                      // Функция для отображения значения параметра
                                      const formatParamValue = (value) => {
                                        if (value === null || value === undefined) return '';
                                        if (typeof value === 'object') {
                                          if (Array.isArray(value)) {
                                            if (value.length > 0 && typeof value[0] === 'object') {
                                              return `[${value.length} элементов]`;
                                            }
                                            return value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(',');
                                          }
                                          const objKeys = Object.keys(value);
                                          if (objKeys.length === 0) return '{}';
                                          const simpleValues = objKeys.map(k => `${k}: ${value[k]}`).join(', ');
                                          if (simpleValues.length < 100) {
                                            return simpleValues;
                                          }
                                          return JSON.stringify(value);
                                        }
                                        return String(value);
                                      };
                                      
                                      return (
                                        <Table size="small" sx={{ width: '100%', '& .MuiTableCell-root': { borderBottom: '1px solid var(--border-neutral-primary)', fontSize: '0.875rem' } }}>
                                          <colgroup>
                                            <col style={{ width: '20%' }} />
                                            <col style={{ width: '80%' }} />
                                          </colgroup>
                                          <TableBody>
                                            {operations.map((operation, idx) => {
                                              if (!operation || typeof operation !== 'object') return null;
                                              
                                              let opType = null;
                                              let operationParams = null;
                                              
                                              // Для trace.json структура: { Success: { operation: "...", ... } } или { Failure: { operation: "...", ... } }
                                              if (operation.Success) {
                                                opType = operation.Success.operation || 'SUCCESS';
                                                operationParams = operation.Success;
                                              } else if (operation.Failure) {
                                                opType = operation.Failure.operation || 'FAILURE';
                                                operationParams = operation.Failure;
                                              } else {
                                                // Пробуем найти операцию по ключу
                                                const keys = Object.keys(operation);
                                                const foundOpKey = keys.find(key => knownOps.includes(key.toUpperCase()) || knownOps.includes(key));
                                                
                                                if (foundOpKey) {
                                                  opType = foundOpKey;
                                                  operationParams = operation[foundOpKey] || {};
                                                } else {
                                                  opType = 'UNKNOWN';
                                                  operationParams = operation;
                                                }
                                              }
                                              
                                              // Извлекаем параметры, исключая служебные поля
                                              const excludeFields = ['operation', 'Operation', 'type', 'Type', 'op', 'Op', 'Success', 'Failure', 'errno', 'strerror', 'subcall', 'return_code', 'execution_time'];
                                              const params = operationParams && typeof operationParams === 'object' 
                                                ? Object.keys(operationParams).filter(key => !excludeFields.includes(key))
                                                : [];
                                              
                                              return (
                                                <React.Fragment key={`op-${idx}`}>
                                                  <TableRow>
                                                    <TableCell colSpan={2} sx={{ fontWeight: 600, backgroundColor: 'var(--surface-neutral-secondary)', pt: 1.5, pb: 1 }}>
                                                      {opType}
                                                    </TableCell>
                                                  </TableRow>
                                                  {params.length > 0 ? (
                                                    params.map((paramKey) => {
                                                      const paramValue = operationParams[paramKey];
                                                      if (paramValue && typeof paramValue === 'object' && !Array.isArray(paramValue)) {
                                                        const subParams = Object.keys(paramValue);
                                                        if (subParams.length > 0) {
                                                          return (
                                                            <React.Fragment key={`op-${idx}-param-${paramKey}`}>
                                                              {subParams.map((subKey) => (
                                                                <TableRow key={`op-${idx}-param-${paramKey}-${subKey}`}>
                                                                  <TableCell sx={{ width: '20%', fontWeight: 500, pl: 4 }}>{subKey}</TableCell>
                                                                  <TableCell sx={{ fontFamily: 'monospace', width: '80%' }}>{formatParamValue(paramValue[subKey])}</TableCell>
                                                                </TableRow>
                                                              ))}
                                                            </React.Fragment>
                                                          );
                                                        }
                                                      }
                                                      return (
                                                        <TableRow key={`op-${idx}-param-${paramKey}`}>
                                                          <TableCell sx={{ width: '20%', fontWeight: 500 }}>{paramKey}</TableCell>
                                                          <TableCell sx={{ fontFamily: 'monospace', width: '80%' }}>{formatParamValue(paramValue)}</TableCell>
                                                        </TableRow>
                                                      );
                                                    })
                                                  ) : (
                                                    <TableRow>
                                                      <TableCell colSpan={2} sx={{ color: 'var(--text-neutral-secondary)', fontStyle: 'italic' }}>
                                                        Нет параметров
                                                      </TableCell>
                                                    </TableRow>
                                                  )}
                                                </React.Fragment>
                                              );
                                            })}
                                          </TableBody>
                                        </Table>
                                      );
                                    };
                                    
                                    return (
                                      <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                                        <Box>
                                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                            {selectedFsTrace.left || availableFsList[0]}
                                          </Typography>
                                          {renderJsonTable(leftParsed, 'Слева')}
                                        </Box>
                                        {selectedFsTrace.right && selectedFsTrace.right !== selectedFsTrace.left && (
                                          <Box>
                                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                              {selectedFsTrace.right}
                                            </Typography>
                                            {renderJsonTable(rightParsed, 'Справа')}
                                          </Box>
                                        )}
                                      </Box>
                                    );
                                  }

                                  if (!leftText && !rightText) {
                                    return (
                                      <Box sx={{ p: 2, color: "var(--text-neutral-secondary)" }}>
                                        Нет данных для выбранных настроек
                                      </Box>
                                    );
                                  }

                                  return (
                                    <Box>
                                      {parseDiff(formpatch(leftText, rightText)).map(
                                        renderFile
                                      )}
                                    </Box>
                                  );
                                })()}
                              </Stack>
                            </AccordionDetails>
                          </Accordion>
                        )}
                        
                        {/* Полноэкранный диалог для таблицы diff */}
                        {item.TestCases && item.TestCases.length > 0 && availableFsList.length >= 1 && (() => {
                            const isJsonFile = currentKind === "trace";
                            if (!isJsonFile) return null;
                            
                            const bugId = item.ID || item.id || 'unknown';
                            const diffViewKey = `${bugId}-${currentKind}`;
                            const diffViewMode = diffViewModes[diffViewKey] || 'diff';
                            const isFullscreenOpen = diffFullscreenOpen[diffViewKey] || false;
                            
                            if (diffViewMode !== 'table') return null;
                            
                            const tc0 = item.TestCases[0];
                            let leftRaw = "";
                            let rightRaw = "";
                            
                            const fsLeft = getFsSummary(tc0, selectedFsTrace.left || availableFsList[0]);
                            const fsRight = getFsSummary(tc0, selectedFsTrace.right || selectedFsTrace.left || availableFsList[0]);
                            const traceLeft = getTraceData(fsLeft);
                            const traceRight = getTraceData(fsRight);
                            leftRaw = traceLeft || "";
                            rightRaw = traceRight || "";
                            
                            let leftParsed = null;
                            let rightParsed = null;
                            
                            try {
                              if (leftRaw) {
                                leftParsed = JSON.parse(leftRaw);
                              }
                            } catch (e) {
                              console.error("Error parsing left JSON:", e);
                            }
                            
                            try {
                              if (rightRaw) {
                                rightParsed = JSON.parse(rightRaw);
                              }
                            } catch (e) {
                              console.error("Error parsing right JSON:", e);
                            }
                            
                            // Функция для отображения значения параметра (аналогично test.json)
                            const formatParamValue = (value) => {
                              if (value === null || value === undefined) return '';
                              if (typeof value === 'object') {
                                if (Array.isArray(value)) {
                                  if (value.length > 0 && typeof value[0] === 'object') {
                                    return `[${value.length} элементов]`;
                                  }
                                  return value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(',');
                                }
                                const objKeys = Object.keys(value);
                                if (objKeys.length === 0) return '{}';
                                const simpleValues = objKeys.map(k => `${k}: ${value[k]}`).join(', ');
                                if (simpleValues.length < 100) {
                                  return simpleValues;
                                }
                                return JSON.stringify(value);
                              }
                              return String(value);
                            };
                            
                            const renderJsonTable = (parsed, label) => {
                              if (!parsed) {
                                return (
                                  <Box sx={{ p: 2, color: 'var(--text-neutral-secondary)' }}>
                                    {label}: Нет данных
                                  </Box>
                                );
                              }
                              
                              let operations = null;
                              if (parsed.rows && Array.isArray(parsed.rows)) {
                                operations = parsed.rows;
                              } else if (parsed.ops && Array.isArray(parsed.ops)) {
                                operations = parsed.ops;
                              } else if (Array.isArray(parsed)) {
                                operations = parsed;
                              } else {
                                operations = [parsed];
                              }
                              
                              if (!operations || operations.length === 0) {
                                return (
                                  <Box sx={{ p: 2, color: 'var(--text-neutral-secondary)' }}>
                                    {label}: Нет данных
                                  </Box>
                                );
                              }
                              
                              const knownOps = [
                                'MKDIR', 'OPEN', 'CREATE', 'CLOSE', 'READ', 'WRITE', 'PREAD', 'PWRITE',
                                'LSEEK', 'TRUNCATE', 'FTRUNCATE', 'RENAME', 'UNLINK', 'SYMLINK', 'HARDLINK',
                                'CHMOD', 'FCHMOD', 'CHMODAT', 'FCHMODAT', 'MKDIRAT',
                                'SETXATTR', 'GETXATTR', 'LISTXATTR', 'REMOVEXATTR',
                                'FSYNC', 'FSTAT', 'STAT', 'FSTATAT', 'LINKAT', 'HARDLINKAT'
                              ];
                              
                              return (
                                <Table size="small" sx={{ width: '100%', '& .MuiTableCell-root': { borderBottom: '1px solid var(--border-neutral-primary)', fontSize: '0.875rem' } }}>
                                  <colgroup>
                                    <col style={{ width: '20%' }} />
                                    <col style={{ width: '80%' }} />
                                  </colgroup>
                                  <TableBody>
                                    {operations.map((operation, idx) => {
                                      if (!operation || typeof operation !== 'object') return null;
                                      
                                      let opType = null;
                                      let operationParams = null;
                                      
                                      // Для trace.json структура: { Success: { operation: "...", ... } } или { Failure: { operation: "...", ... } }
                                      if (operation.Success) {
                                        opType = operation.Success.operation || 'SUCCESS';
                                        operationParams = operation.Success;
                                      } else if (operation.Failure) {
                                        opType = operation.Failure.operation || 'FAILURE';
                                        operationParams = operation.Failure;
                                      } else {
                                        // Пробуем найти операцию по ключу
                                        const keys = Object.keys(operation);
                                        const foundOpKey = keys.find(key => knownOps.includes(key.toUpperCase()) || knownOps.includes(key));
                                        
                                        if (foundOpKey) {
                                          opType = foundOpKey;
                                          operationParams = operation[foundOpKey] || {};
                                        } else {
                                          opType = 'UNKNOWN';
                                          operationParams = operation;
                                        }
                                      }
                                      
                                      // Извлекаем параметры, исключая служебные поля
                                      const excludeFields = ['operation', 'Operation', 'type', 'Type', 'op', 'Op', 'Success', 'Failure', 'errno', 'strerror', 'subcall', 'return_code', 'execution_time'];
                                      const params = operationParams && typeof operationParams === 'object' 
                                        ? Object.keys(operationParams).filter(key => !excludeFields.includes(key))
                                        : [];
                                      
                                      return (
                                        <React.Fragment key={`op-${idx}`}>
                                          <TableRow>
                                            <TableCell colSpan={2} sx={{ fontWeight: 600, backgroundColor: 'var(--surface-neutral-secondary)', pt: 1.5, pb: 1 }}>
                                              {opType}
                                            </TableCell>
                                          </TableRow>
                                          {params.length > 0 ? (
                                            params.map((paramKey) => {
                                              const paramValue = operationParams && typeof operationParams === 'object' 
                                                ? operationParams[paramKey] 
                                                : operation[paramKey];
                                              if (paramValue && typeof paramValue === 'object' && !Array.isArray(paramValue)) {
                                                const subParams = Object.keys(paramValue);
                                                if (subParams.length > 0) {
                                                  return (
                                                    <React.Fragment key={`op-${idx}-param-${paramKey}`}>
                                                      {subParams.map((subKey) => (
                                                        <TableRow key={`op-${idx}-param-${paramKey}-${subKey}`}>
                                                          <TableCell sx={{ width: '20%', fontWeight: 500, pl: 4 }}>{subKey}</TableCell>
                                                          <TableCell sx={{ fontFamily: 'monospace', width: '80%' }}>{formatParamValue(paramValue[subKey])}</TableCell>
                                                        </TableRow>
                                                      ))}
                                                    </React.Fragment>
                                                  );
                                                }
                                              }
                                              return (
                                                <TableRow key={`op-${idx}-param-${paramKey}`}>
                                                  <TableCell sx={{ width: '20%', fontWeight: 500 }}>{paramKey}</TableCell>
                                                  <TableCell sx={{ fontFamily: 'monospace', width: '80%' }}>{formatParamValue(paramValue)}</TableCell>
                                                </TableRow>
                                              );
                                            })
                                          ) : (
                                            <TableRow>
                                              <TableCell colSpan={2} sx={{ color: 'var(--text-neutral-secondary)', fontStyle: 'italic' }}>
                                                Нет параметров
                                              </TableCell>
                                            </TableRow>
                                          )}
                                        </React.Fragment>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              );
                            };
                            
                            return (
                              <Dialog
                                open={isFullscreenOpen}
                                onClose={() => setDiffFullscreenOpen(prev => ({ ...prev, [diffViewKey]: false }))}
                                maxWidth={false}
                                fullWidth
                                PaperProps={{
                                  sx: {
                                    width: '95vw',
                                    height: '95vh',
                                    maxWidth: 'none',
                                    maxHeight: 'none',
                                    m: 2
                                  }
                                }}
                              >
                                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="h6">trace.json - Таблица</Typography>
                                  <IconButton onClick={() => setDiffFullscreenOpen(prev => ({ ...prev, [diffViewKey]: false }))}>
                                    <FullscreenExitIcon />
                                  </IconButton>
                                </DialogTitle>
                                <DialogContent sx={{ p: 0, overflow: 'auto', height: '100%' }}>
                                  <Box sx={{ width: '100%', height: '100%', p: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                                      <Box>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                          {selectedFsTrace.left || availableFsList[0]}
                                        </Typography>
                                        {renderJsonTable(leftParsed, 'Слева')}
                                      </Box>
                                      {selectedFsTrace.right && selectedFsTrace.right !== selectedFsTrace.left && (
                                        <Box>
                                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                            {selectedFsTrace.right}
                                          </Typography>
                                          {renderJsonTable(rightParsed, 'Справа')}
                                        </Box>
                                      )}
                                    </Box>
                                  </Box>
                                </DialogContent>
                              </Dialog>
                            );
                          })()}
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
