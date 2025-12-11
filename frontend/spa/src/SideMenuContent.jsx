import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";

import { storage } from "./Data.js";
import { datalayer } from "./DataLayer.js";

export default function SideMenuContent({ callback }) { 
  const [runs, setRuns] = React.useState([]);
  React.useEffect(()=> {
    async function get_runs (){
      const data = await datalayer.get_runs();
      setRuns(data);
    }
    get_runs()
  }, []);

  return (
    <Stack
      sx={{
        flexGrow: 1,
        alignItems: "stretch",
        justifyContent: "space-between",
      }}
    >
        <List>
          {runs
            .map((item, index) => (
              <ListItem key={index}>
                <ListItemButton
                  onClick={() => {
                    callback(item);
                  }}
                >
                  <ListItemText primary={item.id} />
                </ListItemButton>
              </ListItem>
            ))}
        </List>
    </Stack>
  );
}
