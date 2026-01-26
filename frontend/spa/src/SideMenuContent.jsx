import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Autocomplete from "@mui/material/Autocomplete";

import { datalayer } from "./DataLayer.js";

export default function SideMenuContent({ callback }) { 
  const [allRuns, setAllRuns] = React.useState([]); 
  const [filteredRuns, setFilteredRuns] = React.useState([]); 
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [selectedTags, setSelectedTags] = React.useState([]);
  const [availableTags, setAvailableTags] = React.useState([]);
  const [isFiltered, setIsFiltered] = React.useState(false);

  const filterRuns = React.useCallback((runs, from, to, tags) => {
    let filtered = [...runs];

    if (from || to) {
      filtered = filtered.filter(run => {
        if (!run.datetime) return false;
        
        const runDate = new Date(run.datetime);
        runDate.setHours(0, 0, 0, 0);
        
        if (from) {
          const fromDateObj = new Date(from);
          fromDateObj.setHours(0, 0, 0, 0);
          if (runDate < fromDateObj) {
            return false;
          }
        }
        
        if (to) {
          const toDateObj = new Date(to);
          toDateObj.setHours(23, 59, 59, 999);
          if (runDate > toDateObj) {
            return false;
          }
        }
        
        return true;
      });
    }

    if (tags && tags.length > 0) {
      const tagSet = new Set(tags.map(t => String(t).toLowerCase().trim()));
      filtered = filtered.filter(run => {
        if (!run.tags || !Array.isArray(run.tags)) return false;
        const runTags = run.tags.map(t => String(t).toLowerCase().trim());
        return runTags.some(tag => tagSet.has(tag));
      });
    }

    return filtered;
  }, []);

  React.useEffect(() => {
    async function get_runs() {
      const data = await datalayer.get_runs();
      setAllRuns(data);
      setFilteredRuns(data);
    }
    
    async function get_tags() {
      try {
        const tags = await datalayer.get_all_tags();
        console.log("Loaded tags for filter:", tags);
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
    
    const handleRunDeleted = async () => {
      console.log("SideMenuContent: Run deleted event received, reloading runs.");
      const data = await datalayer.get_runs();
      setAllRuns(data);
      const filtered = filterRuns(data, fromDate || null, toDate || null, selectedTags);
      setFilteredRuns(filtered);
    };
    
    window.addEventListener('tagsUpdated', handleTagsUpdate);
    window.addEventListener('runDeleted', handleRunDeleted);
    
    get_runs();
    get_tags();
    
    return () => {
      window.removeEventListener('tagsUpdated', handleTagsUpdate);
      window.removeEventListener('runDeleted', handleRunDeleted);
    };
  }, []);

  React.useEffect(() => {
    if (isFiltered) {
      const filtered = filterRuns(allRuns, fromDate || null, toDate || null, selectedTags);
      setFilteredRuns(filtered);
    } else {
      setFilteredRuns(allRuns);
    }
  }, [allRuns, fromDate, toDate, selectedTags, isFiltered, filterRuns]);

  const handleApplyFilter = () => {
    setIsFiltered(true);
  };

  const handleClearFilter = () => {
    setIsFiltered(false);
    setFromDate("");
    setToDate("");
    setSelectedTags([]);
  };

  return (
    <Stack
      sx={{
        flexGrow: 1,
        alignItems: "stretch",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Фильтр
        </Typography>
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
      <List sx={{ flexGrow: 1, overflow: "auto" }}>
        {filteredRuns
          .map((item, index) => (
            <ListItem key={index}>
              <ListItemButton
                onClick={() => {
                  callback(item);
                }}
              >
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </Stack>
  );
}
