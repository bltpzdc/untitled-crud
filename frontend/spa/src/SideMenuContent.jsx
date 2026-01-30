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

export default function SideMenuContent({ callback, mode = "runs" }) { 
  // mode: "runs" | "errors"
  const [allRuns, setAllRuns] = React.useState([]); 
  const [filteredRuns, setFilteredRuns] = React.useState([]); 
  const [allErrors, setAllErrors] = React.useState([]); 
  const [filteredErrors, setFilteredErrors] = React.useState([]); 
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [selectedTags, setSelectedTags] = React.useState([]);
  const [selectedOperations, setSelectedOperations] = React.useState([]);
  const [selectedFsTypes, setSelectedFsTypes] = React.useState([]);
  const [availableTags, setAvailableTags] = React.useState([]);
  const [availableOperations, setAvailableOperations] = React.useState([]);
  const [isFiltered, setIsFiltered] = React.useState(false);

  // Вспомогательная функция: собрать все ошибки из всех испытаний
  const collectAllErrors = React.useCallback((runs) => {
    const errors = [];
    runs.forEach((run) => {
      if (run.bugs && Array.isArray(run.bugs)) {
        run.bugs.forEach((bug) => {
          const operation = bug.Operation || bug.operation || "";
          const opKey = operation.trim() || "Без операции";
          const bugId = bug.ID || bug.id;
          const groupKey = `${run.id}-${bugId}-${opKey}`;
          errors.push({
            key: groupKey,
            runId: run.id,
            runText: run.text,
            operation: opKey,
            bug,
          });
        });
      }
    });
    return errors;
  }, []);

  const filterRuns = React.useCallback((runs, from, to, tags, operations, fsTypes) => {
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

    if (fsTypes && fsTypes.length > 0) {
      const fsSet = new Set(fsTypes.map(fs => String(fs).toLowerCase().trim()));
      filtered = filtered.filter(run => {
        if (!run.fstype || !Array.isArray(run.fstype)) return false;
        const runFs = run.fstype.map(fs => String(fs).toLowerCase().trim());
        return runFs.some(fs => fsSet.has(fs));
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

  const filterErrors = React.useCallback((errors, from, to, tags, operations, fsTypes, runs) => {
    let filtered = [...errors];

    // Фильтр по дате запуска
    if (from || to) {
      filtered = filtered.filter((err) => {
        const run = runs.find((r) => r.id === err.runId);
        if (!run || !run.datetime) return false;
        
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

    // Фильтр по тегам запуска
    if (tags && tags.length > 0) {
      const tagSet = new Set(tags.map((t) => String(t).toLowerCase().trim()));
      filtered = filtered.filter((err) => {
        const run = runs.find((r) => r.id === err.runId);
        if (!run || !run.tags || !Array.isArray(run.tags)) return false;
        const runTags = run.tags.map((t) => String(t).toLowerCase().trim());
        return runTags.some((tag) => tagSet.has(tag));
      });
    }

    // Фильтр по файловым системам запуска
    if (fsTypes && fsTypes.length > 0) {
      const fsSet = new Set(fsTypes.map(fs => String(fs).toLowerCase().trim()));
      filtered = filtered.filter((err) => {
        const run = runs.find((r) => r.id === err.runId);
        if (!run || !run.fstype || !Array.isArray(run.fstype)) return false;
        const runFs = run.fstype.map(fs => String(fs).toLowerCase().trim());
        return runFs.some(fs => fsSet.has(fs));
      });
    }

    // Фильтр по типу операции
    if (operations && operations.length > 0) {
      const operationSet = new Set(
        operations.map((op) => String(op).toLowerCase().trim())
      );
      filtered = filtered.filter((err) => {
        const op = String(err.operation || "").toLowerCase().trim();
        return op && operationSet.has(op);
      });
    }

    return filtered;
  }, []);

  React.useEffect(() => {
    async function get_runs() {
      const data = await datalayer.get_runs();
      setAllRuns(data);
      setFilteredRuns(data);
      const allErrs = collectAllErrors(data);
      setAllErrors(allErrs);
      setFilteredErrors(allErrs);
      
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
      const allErrs = collectAllErrors(data);
      setAllErrors(allErrs);

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

      const filteredRunsNew = filterRuns(data, fromDate || null, toDate || null, selectedTags, selectedOperations, selectedFsTypes);
      setFilteredRuns(filteredRunsNew);
      const filteredErrorsNew = filterErrors(allErrs, fromDate || null, toDate || null, selectedTags, selectedOperations, selectedFsTypes, data);
      setFilteredErrors(filteredErrorsNew);
    };
    
    const handleRunUpdated = async (event) => {
      const { runId, tags, comment } = event.detail || {};
      if (!runId) return;
      
      console.log("SideMenuContent: Run updated event received, updating run", runId);
      
      const data = await datalayer.get_runs();
      setAllRuns(data);
      const allErrs = collectAllErrors(data);
      setAllErrors(allErrs);

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

      const filteredRunsNew = filterRuns(data, fromDate || null, toDate || null, selectedTags, selectedOperations, selectedFsTypes);
      setFilteredRuns(filteredRunsNew);
      const filteredErrorsNew = filterErrors(allErrs, fromDate || null, toDate || null, selectedTags, selectedOperations, selectedFsTypes, data);
      setFilteredErrors(filteredErrorsNew);
    };
    
    const handleRunsReload = async () => {
      console.log("SideMenuContent: Runs reload event received, reloading runs.");
      const data = await datalayer.get_runs();
      setAllRuns(data);
      const allErrs = collectAllErrors(data);
      setAllErrors(allErrs);

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

      const filteredRunsNew = filterRuns(data, fromDate || null, toDate || null, selectedTags, selectedOperations, selectedFsTypes);
      setFilteredRuns(filteredRunsNew);
      const filteredErrorsNew = filterErrors(allErrs, fromDate || null, toDate || null, selectedTags, selectedOperations, selectedFsTypes, data);
      setFilteredErrors(filteredErrorsNew);
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
      const { fromDate: fd, toDate: td, selectedTags: st, selectedOperations: so, selectedFsTypes: sfs } = event.detail || {};
      setFromDate(fd || "");
      setToDate(td || "");
      setSelectedTags(st || []);
      setSelectedOperations(so || []);
      setSelectedFsTypes(sfs || []);
      setIsFiltered(true);
    };
    
    const handleClearFilter = () => {
      setIsFiltered(false);
      setFromDate("");
      setToDate("");
      setSelectedTags([]);
      setSelectedOperations([]);
      setSelectedFsTypes([]);
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
      const filteredRunsNew = filterRuns(allRuns, fromDate || null, toDate || null, selectedTags, selectedOperations, selectedFsTypes);
      setFilteredRuns(filteredRunsNew);
      const filteredErrorsNew = filterErrors(allErrors, fromDate || null, toDate || null, selectedTags, selectedOperations, selectedFsTypes, allRuns);
      setFilteredErrors(filteredErrorsNew);
    } else {
      setFilteredRuns(allRuns);
      setFilteredErrors(allErrors);
    }
  }, [allRuns, allErrors, fromDate, toDate, selectedTags, selectedOperations, selectedFsTypes, isFiltered, filterRuns, filterErrors]);

  const listData = mode === "errors" ? filteredErrors : filteredRuns;

  return (
    <List sx={{ flexGrow: 1, overflow: "auto", padding: 0, height: "100%" }}>
      {listData.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'var(--text-neutral-secondary)' }}>
            {mode === "errors" ? "Нет ошибок" : "Нет испытаний"}
          </Typography>
        </Box>
      ) : (
        listData.map((item, index) => {
          if (mode === "errors") {
            return (
              <ListItem key={item.key || index} sx={{ padding: 0 }}>
                <ListItemButton
                  onClick={() => {
                    const bugWithDatatype = { ...(item.bug || {}), datatype: "bug" };
                    callback(bugWithDatatype);
                  }}
                  sx={{
                    padding: '12px 16px',
                    '&:hover': {
                      backgroundColor: 'var(--surface-neutral-secondary)',
                    },
                  }}
                >
                  <ListItemText
                    primary={`${item.operation}`}
                    secondary={item.runText}
                    primaryTypographyProps={{
                      sx: {
                        color: 'var(--text-neutral-primary)',
                        fontSize: '14px',
                        fontWeight: 400,
                      },
                    }}
                    secondaryTypographyProps={{
                      sx: {
                        color: 'var(--text-neutral-secondary)',
                        fontSize: '12px',
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          }

          return (
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
          );
        })
      )}
    </List>
  );
}
