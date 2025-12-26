import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  typography: {
    fieldHeader: {
      fontSize: 16,
      fontWeight: 400,
      color: "var(--text-neutral-primary)",
    },
    fieldValue: {
      fontSize: 16,
      fontWeight: 600,
      color: "var(--text-neutral-primary)",
    },
    textField: {
      fontSize: 14,
      fontWeight: 400,
      color: "var(--text-neutral-primary)",
    },
  },
  components: {
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
    },

    // Лейбл TextField
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: 14,
          color: "var(--text-neutral-primary)",
        },
      },
    },

    // Рамка и инпут для variant="outlined"
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "& fieldset": {
            borderColor: "var(--border-neutral-primary)",
          },
          "&:hover fieldset": {
            borderColor: "#666",
          },
          "&.Mui-focused fieldset": {
            borderColor: "var(--border-accent-default)",
            borderWidth: 1,
          },
        },
        input: {
          padding: "8px 12px",
          fontSize: 14,
          marginTop: '2px',
        },
      },
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          fieldHeader: "span",
          fieldValue: "span",
        },
      },
    },
  },
});