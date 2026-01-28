import * as React from "react";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import FilterListIcon from "@mui/icons-material/FilterList";
import SideMenuContent from "./SideMenuContent.jsx";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import { datalayer } from "./DataLayer.js";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

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
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

export default function SelectContent({ callback }) {
  const [value, setValue] = React.useState(0);
  const [filterExpanded, setFilterExpanded] = React.useState(false);
  const [mode, setMode] = React.useState("runs"); // "runs" | "errors"
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [selectedTags, setSelectedTags] = React.useState([]);
  const [selectedOperations, setSelectedOperations] = React.useState([]);
  const [selectedFsTypes, setSelectedFsTypes] = React.useState([]);
  const [availableTags, setAvailableTags] = React.useState([]);
  const [availableOperations, setAvailableOperations] = React.useState([]);
  const [availableFsTypes, setAvailableFsTypes] = React.useState([]);
  const [isFiltered, setIsFiltered] = React.useState(false);

  const [_uploadDummy, setUploadDummy] = React.useState(null);

  const openZipUploadDialog = React.useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip";
    input.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      try {
        await datalayer.upload_zip(file);
        setUploadDummy(null);
        window.dispatchEvent(new Event("runsReload"));
        setValue(0);
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Ошибка при загрузке файла: " + error.message);
      }
    };
    input.click();
  }, []);

  const handleChange = (_event, newvalue) => {
    // Обычное переключение вкладок; загрузку ZIP для "+" обрабатываем через onClick на самой вкладке
    setValue(newvalue);
  };
  
  const handleFilterToggle = () => {
    setFilterExpanded(!filterExpanded);
  };
  
  const handleApplyFilter = () => {
    setIsFiltered(true);
    window.dispatchEvent(new CustomEvent('applyFilter', { 
      detail: { fromDate, toDate, selectedTags, selectedOperations, selectedFsTypes, mode } 
    }));
  };
  
  const handleClearFilter = () => {
    setIsFiltered(false);
    setFromDate("");
    setToDate("");
    setSelectedTags([]);
    setSelectedOperations([]);
    setSelectedFsTypes([]);
    window.dispatchEvent(new CustomEvent('clearFilter'));
  };
  
  React.useEffect(() => {
    async function get_tags() {
      try {
        const tags = await datalayer.get_all_tags();
        setAvailableTags(Array.isArray(tags) ? tags : []);
      } catch (error) {
        console.error("Failed to load tags:", error);
        setAvailableTags([]);
      }
    }
    
    const handleTagsUpdate = (event) => {
      const newTags = event.detail || [];
      setAvailableTags(prevTags => {
        const existingTags = new Set(prevTags.map(t => String(t)));
        newTags.forEach(tag => {
          const tagStr = String(tag);
          if (!existingTags.has(tagStr)) {
            existingTags.add(tagStr);
          }
        });
        return Array.from(existingTags).sort();
      });
    };
    
    const handleRunsReload = async () => {
      const data = await datalayer.get_runs();
      const operationsSet = new Set();
      const fsTypeSet = new Set();
      data.forEach(run => {
        if (Array.isArray(run.fstype)) {
          run.fstype.forEach(fs => {
            if (fs && String(fs).trim()) {
              fsTypeSet.add(String(fs).trim());
            }
          });
        }
        if (run.bugs && Array.isArray(run.bugs)) {
          run.bugs.forEach(bug => {
            const operation = bug.Operation || bug.operation;
            if (operation && String(operation).trim()) {
              operationsSet.add(String(operation).trim());
            }
          });
        }
      });
      const operationsList = Array.from(operationsSet).sort();
      const fsTypesList = Array.from(fsTypeSet).sort();
      setAvailableOperations(operationsList);
      setAvailableFsTypes(fsTypesList);
    };
    
    window.addEventListener('tagsUpdated', handleTagsUpdate);
    window.addEventListener('runsReload', handleRunsReload);
    
    get_tags();
    handleRunsReload();
    
    return () => {
      window.removeEventListener('tagsUpdated', handleTagsUpdate);
      window.removeEventListener('runsReload', handleRunsReload);
    };
  }, []);

  return (
    <Box
      style={{ width: "100%" }}
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-neutral-primary)' }}>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <ToggleButtonGroup
            exclusive
            value={mode}
            onChange={(_e, val) => {
              if (val) {
                setMode(val);
              }
            }}
            sx={{
              flexGrow: 1,
              height: 48,
              '& .MuiToggleButton-root': {
                flex: 1,
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 400,
                color: 'var(--text-neutral-secondary)',
                borderColor: 'var(--border-neutral-primary)',
                '&.Mui-selected': {
                  color: 'var(--text-neutral-primary)',
                  fontWeight: 500,
                  backgroundColor: 'var(--surface-neutral-secondary)',
                  '&:hover': {
                    backgroundColor: 'var(--surface-neutral-secondary)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'var(--surface-neutral-secondary)',
                },
              },
            }}
          >
            <ToggleButton value="runs">
              Испытания
            </ToggleButton>
            <ToggleButton value="errors">
              Ошибки
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="Select mode"
          variant="standard"
          sx={{
            minHeight: 48,
            '& .MuiTabs-flexContainer': {
              borderBottom: 'none',
            },
          }}
        >
          <Tab
            label="+"
            {...a11yProps(1)}
            onClick={() => {
              // Явно открываем диалог выбора ZIP по клику на "+"
              openZipUploadDialog();
            }}
            sx={{
              width: 48,
              minWidth: 48,
              maxWidth: 48,
              fontSize: '28px',
              fontWeight: 300,
              minHeight: 48,
              color: 'var(--text-neutral-secondary)',
              '&.Mui-selected': {
                color: 'var(--text-neutral-primary)',
              },
            }}
          />
        </Tabs>
        <IconButton
          onClick={handleFilterToggle}
          sx={{
            mr: 1,
            color: filterExpanded ? 'var(--accent-primary-default)' : 'var(--text-neutral-secondary)',
            '&:hover': {
              backgroundColor: 'var(--surface-neutral-secondary)',
            },
          }}
          aria-label="Фильтр"
        >
          <FilterListIcon />
        </IconButton>
      </Box>

      {filterExpanded && value === 0 && (
        <Box sx={{ p: 2, borderBottom: '1px solid var(--border-neutral-primary)', backgroundColor: 'var(--surface-neutral-primary)' }}>
          <Stack spacing={2}>
            <TextField
              label="От"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              size="small"
              fullWidth
            />
            <TextField
              label="До"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              size="small"
              fullWidth
            />
            <Autocomplete
              multiple
              options={Array.isArray(availableTags) ? availableTags : []}
              value={Array.isArray(selectedTags) ? selectedTags.map(tag => String(tag || '')) : []}
              onChange={(event, newValue) => {
                const stringTags = (newValue || [])
                  .filter(tag => tag != null)
                  .map(tag => String(tag).trim())
                  .filter(tag => tag.length > 0);
                setSelectedTags(stringTags);
              }}
              isOptionEqualToValue={(option, value) => {
                return String(option || '') === String(value || '');
              }}
              getOptionLabel={(option) => {
                return String(option || '');
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Теги"
                  size="small"
                  placeholder="Выберите теги"
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
                        key={`filter-tag-${index}-${label}`}
                        label={label}
                        size="small"
                        {...getTagProps({ index })}
                      />
                    );
                  })
                  .filter(Boolean);
              }}
            />
            <Autocomplete
              multiple
              options={Array.isArray(availableFsTypes) ? availableFsTypes : []}
              value={Array.isArray(selectedFsTypes) ? selectedFsTypes.map(fs => String(fs || '')) : []}
              onChange={(event, newValue) => {
                const stringFs = (newValue || [])
                  .filter(fs => fs != null)
                  .map(fs => String(fs).trim())
                  .filter(fs => fs.length > 0);
                setSelectedFsTypes(stringFs);
              }}
              isOptionEqualToValue={(option, value) => {
                return String(option || '') === String(value || '');
              }}
              getOptionLabel={(option) => {
                return String(option || '');
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Файловая система"
                  size="small"
                  placeholder="Выберите FS"
                />
              )}
              renderTags={(value, getTagProps) => {
                if (!Array.isArray(value)) {
                  return null;
                }
                return value
                  .filter(fs => fs != null && fs !== '')
                  .map((option, index) => {
                    const label = String(option).trim();
                    
                    if (!label) {
                      return null;
                    }
                    
                    return (
                      <Chip
                        key={`filter-fs-${index}-${label}`}
                        label={label}
                        size="small"
                        {...getTagProps({ index })}
                      />
                    );
                  })
                  .filter(Boolean);
              }}
            />
            <Autocomplete
              multiple
              options={Array.isArray(availableOperations) ? availableOperations : []}
              value={Array.isArray(selectedOperations) ? selectedOperations.map(op => String(op || '')) : []}
              onChange={(event, newValue) => {
                const stringOps = (newValue || [])
                  .filter(op => op != null)
                  .map(op => String(op).trim())
                  .filter(op => op.length > 0);
                setSelectedOperations(stringOps);
              }}
              isOptionEqualToValue={(option, value) => {
                return String(option || '') === String(value || '');
              }}
              getOptionLabel={(option) => {
                return String(option || '');
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Тип операции"
                  size="small"
                  placeholder="Выберите операции"
                />
              )}
              renderTags={(value, getTagProps) => {
                if (!Array.isArray(value)) {
                  return null;
                }
                return value
                  .filter(op => op != null && op !== '')
                  .map((option, index) => {
                    const label = String(option).trim();
                    
                    if (!label) {
                      return null;
                    }
                    
                    return (
                      <Chip
                        key={`filter-op-${index}-${label}`}
                        label={label}
                        size="small"
                        {...getTagProps({ index })}
                      />
                    );
                  })
                  .filter(Boolean);
              }}
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={handleApplyFilter}
                size="small"
                fullWidth
              >
                Применить
              </Button>
              {isFiltered && (
                <Button
                  variant="outlined"
                  onClick={handleClearFilter}
                  size="small"
                  fullWidth
                >
                  Сбросить
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
      )}
      
      <TabPanel value={value} index={0}>
        <SideMenuContent callback={callback} mode={mode} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Box sx={{ p: 3 }}>
          <Button
            variant="contained"
            onClick={openZipUploadDialog}
            fullWidth
          >
            Загрузить ZIP
          </Button>
        </Box>
      </TabPanel>
    </Box>
  );
}
