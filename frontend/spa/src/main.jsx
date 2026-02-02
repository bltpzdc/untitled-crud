import { StrictMode, useState, useEffect } from "react";
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
import { lightTheme, darkTheme } from "./Theme.js";

function App() {
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('theme-mode');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    // Применяем тему к документу
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('theme-mode', themeMode);
  }, [themeMode]);

  const currentTheme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <StrictMode>
        <Box sx={{ display: "flex" }}>
          {/* NOTE(savikin): put sidemenu inside MainMenu
           while working around layout bugs */}
          <MainMenu themeMode={themeMode} setThemeMode={setThemeMode} />
        </Box>
      </StrictMode>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);