import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import { ThemeProvider } from "@mui/material/styles";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";    //regular
import "@fontsource/roboto/500.css";    //meduim
import "@fontsource/roboto/600.css";    //semibold
import "@fontsource/roboto/700.css";

import MainMenu from "./MainMenu.jsx";
import { theme } from "./Theme.js";

createRoot(document.getElementById("root")).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <StrictMode>
      <Box sx={{ display: "flex" }}>
        {/* NOTE(savikin): put sidemenu inside MainMenu
         while working around layout bugs */}
        <MainMenu />
      </Box>
    </StrictMode>
  </ThemeProvider>
);