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
  const [selectedOperations, setSelectedOperations] = React.useState([]);
  const [availableTags, setAvailableTags] = React.useState([]);
  const [availableOperations, setAvailableOperations] = React.useState([]);
  const [isFiltered, setIsFiltered] = React.useState(false);

  const filterRuns = React.useCallback((runs, from, to, tags, operations) => {
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

    if (operations && operations.length > 0) {
      const operationSet = new Set(operations.map(op => String(op).toLowerCase().trim()));
      filtered = filtered.filter(run => {
        if (!run.bugs || !Array.isArray(run.bugs)) return false;
        // Проверяем, есть ли хотя бы один баг с выбранной операцией
        return run.bugs.some(bug => {
          const bugOperation = (bug.Operation || bug.operation || "").toLowerCase().trim();
          return bugOperation && operationSet.has(bugOperation);
        });
      });
    }

    return filtered;
  }, []);

  React.useEffect(() => {
    async function get_runs() {
      const data = await datalayer.get_runs();
      setAllRuns(data);
      setFilteredRuns(data);
      
      // Собираем все уникальные операции из багов
      const operationsSet = new Set();
      data.forEach(run => {
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
      setAvailableOperations(operationsList);
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
      
      const operationsSet = new Set();
      data.forEach(run => {
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
      setAvailableOperations(operationsList);
      
      const filtered = filterRuns(data, fromDate || null, toDate || null, selectedTags, selectedOperations);
      setFilteredRuns(filtered);
    };
    
    const handleRunUpdated = async (event) => {
      const { runId, tags, comment } = event.detail || {};
      if (!runId) return;
      
      console.log("SideMenuContent: Run updated event received, updating run", runId);
      
      const data = await datalayer.get_runs();
      setAllRuns(data);
      
      const operationsSet = new Set();
      data.forEach(run => {
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
      setAvailableOperations(operationsList);
      
      const filtered = filterRuns(data, fromDate || null, toDate || null, selectedTags, selectedOperations);
      setFilteredRuns(filtered);
    };
    
    const handleRunsReload = async () => {
      console.log("SideMenuContent: Runs reload event received, reloading runs.");
      const data = await datalayer.get_runs();
      setAllRuns(data);
      
      const operationsSet = new Set();
      data.forEach(run => {
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
      setAvailableOperations(operationsList);
      
      const filtered = filterRuns(data, fromDate || null, toDate || null, selectedTags, selectedOperations);
      setFilteredRuns(filtered);
    };
    
    window.addEventListener('tagsUpdated', handleTagsUpdate);
    window.addEventListener('runDeleted', handleRunDeleted);
    window.addEventListener('runUpdated', handleRunUpdated);
    window.addEventListener('runsReload', handleRunsReload);
    
    get_runs();
    get_tags();
    
    return () => {
      window.removeEventListener('tagsUpdated', handleTagsUpdate);
      window.removeEventListener('runDeleted', handleRunDeleted);
      window.removeEventListener('runUpdated', handleRunUpdated);
      window.removeEventListener('runsReload', handleRunsReload);
    };
  }, []);

  React.useEffect(() => {
    const handleApplyFilter = (event) => {
      const { fromDate: fd, toDate: td, selectedTags: st, selectedOperations: so } = event.detail || {};
      setFromDate(fd || "");
      setToDate(td || "");
      setSelectedTags(st || []);
      setSelectedOperations(so || []);
      setIsFiltered(true);
    };
    
    const handleClearFilter = () => {
      setIsFiltered(false);
      setFromDate("");
      setToDate("");
      setSelectedTags([]);
      setSelectedOperations([]);
    };
    
    window.addEventListener('applyFilter', handleApplyFilter);
    window.addEventListener('clearFilter', handleClearFilter);
    
    return () => {
      window.removeEventListener('applyFilter', handleApplyFilter);
      window.removeEventListener('clearFilter', handleClearFilter);
    };
  }, []);
  
  React.useEffect(() => {
    if (isFiltered) {
      const filtered = filterRuns(allRuns, fromDate || null, toDate || null, selectedTags, selectedOperations);
      setFilteredRuns(filtered);
    } else {
      setFilteredRuns(allRuns);
    }
  }, [allRuns, fromDate, toDate, selectedTags, selectedOperations, isFiltered, filterRuns]);

  return (
    <List sx={{ flexGrow: 1, overflow: "auto", padding: 0, height: "100%" }}>
        {filteredRuns.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'var(--text-neutral-secondary)' }}>
              Нет испытаний
            </Typography>
          </Box>
        ) : (
          filteredRuns.map((item, index) => (
            <ListItem key={index} sx={{ padding: 0 }}>
              <ListItemButton
                onClick={() => {
                  callback(item);
                }}
                sx={{
                  padding: '12px 16px',
                  '&:hover': {
                    backgroundColor: 'var(--surface-neutral-secondary)',
                  },
                }}
              >
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: {
                      color: 'var(--text-neutral-primary)',
                      fontSize: '14px',
                      fontWeight: 400,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
    </List>
  );
}
