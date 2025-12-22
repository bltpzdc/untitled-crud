import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";

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
