import { createTheme, Theme, ThemeOptions } from '@mui/material/styles';
import { AppearanceSettings, FontSize } from '../types/settings';
import { SEMANTIC_COLORS } from './palette';

// Font size scale based on setting
const getFontSizeScale = (fontSize: FontSize): number => {
  switch (fontSize) {
    case 'small': return 0.875;
    case 'large': return 1.125;
    case 'medium':
    default: return 1;
  }
};

// Light theme configuration
const lightThemeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: SEMANTIC_COLORS.PRIMARY,
      light: SEMANTIC_COLORS.PRIMARY_LIGHT,
      dark: SEMANTIC_COLORS.PRIMARY_DARK
    },
    secondary: {
      main: SEMANTIC_COLORS.SECONDARY,
      light: SEMANTIC_COLORS.SECONDARY_LIGHT,
      dark: SEMANTIC_COLORS.SECONDARY_DARK
    },
    background: {
      default: SEMANTIC_COLORS.BACKGROUND_LIGHT_PAPER,
      paper: SEMANTIC_COLORS.BACKGROUND_LIGHT
    },
    text: {
      primary: SEMANTIC_COLORS.TEXT_PRIMARY_LIGHT,
      secondary: SEMANTIC_COLORS.TEXT_SECONDARY_LIGHT,
      disabled: SEMANTIC_COLORS.TEXT_DISABLED_LIGHT
    },
    grey: {
      50: '#f3f4f6',
      100: '#e5e7eb',
      200: '#d1d5db',
      300: '#9ca3af',
      400: '#6b7280',
      500: '#374151'
    },
    success: {
      main: SEMANTIC_COLORS.SUCCESS
    },
    warning: {
      main: SEMANTIC_COLORS.WARNING
    },
    error: {
      main: SEMANTIC_COLORS.ERROR
    },
    info: {
      main: SEMANTIC_COLORS.INFO
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5
    }
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 768,
      lg: 1024,
      xl: 1200
    }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: SEMANTIC_COLORS.SECONDARY
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: SEMANTIC_COLORS.BACKGROUND_LIGHT_SIDEBAR,
          borderRight: `1px solid ${SEMANTIC_COLORS.BORDER_LIGHT}`
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    }
  }
};

// Dark theme configuration
const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: SEMANTIC_COLORS.PRIMARY_DARK_MODE,
      light: SEMANTIC_COLORS.PRIMARY_LIGHT_DARK_MODE,
      dark: SEMANTIC_COLORS.PRIMARY_DARK_DARK_MODE
    },
    secondary: {
      main: SEMANTIC_COLORS.SECONDARY,
      light: SEMANTIC_COLORS.SECONDARY_LIGHT,
      dark: SEMANTIC_COLORS.SECONDARY_DARK
    },
    background: {
      default: SEMANTIC_COLORS.BACKGROUND_DARK,
      paper: SEMANTIC_COLORS.BACKGROUND_DARK_PAPER
    },
    text: {
      primary: SEMANTIC_COLORS.TEXT_PRIMARY_DARK,
      secondary: SEMANTIC_COLORS.TEXT_SECONDARY_DARK,
      disabled: SEMANTIC_COLORS.TEXT_DISABLED_DARK
    },
    grey: {
      50: '#f3f4f6',
      100: '#e5e7eb',
      200: '#d1d5db',
      300: '#9ca3af',
      400: '#6b7280',
      500: '#374151',
      600: '#1f2937',
      700: '#111827',
      800: '#0a0b0f',
      900: '#050506'
    },
    success: {
      main: SEMANTIC_COLORS.SUCCESS_DARK
    },
    warning: {
      main: SEMANTIC_COLORS.WARNING_DARK
    },
    error: {
      main: SEMANTIC_COLORS.ERROR_DARK
    },
    info: {
      main: SEMANTIC_COLORS.INFO_DARK
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5
    }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: SEMANTIC_COLORS.SECONDARY
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: SEMANTIC_COLORS.BACKGROUND_DARK_SIDEBAR,
          borderRight: `1px solid ${SEMANTIC_COLORS.BORDER_DARK}`
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: SEMANTIC_COLORS.BACKGROUND_DARK_PAPER
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: SEMANTIC_COLORS.TEXT_SECONDARY_DARK,
          '&.Mui-selected': {
            color: SEMANTIC_COLORS.PRIMARY_DARK_MODE
          }
        }
      }
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: SEMANTIC_COLORS.PRIMARY_DARK_MODE,
            '& + .MuiSwitch-track': {
              backgroundColor: SEMANTIC_COLORS.PRIMARY_DARK_MODE
            }
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: SEMANTIC_COLORS.BORDER_DARK
            },
            '&:hover fieldset': {
              borderColor: SEMANTIC_COLORS.PRIMARY_LIGHT_DARK_MODE
            },
            '&.Mui-focused fieldset': {
              borderColor: SEMANTIC_COLORS.PRIMARY_DARK_MODE
            }
          }
        }
      }
    }
  }
};

// Create themes
export const lightTheme = createTheme(lightThemeOptions);
export const darkTheme = createTheme(darkThemeOptions);

// Enhanced theme creator function with appearance settings
export const createAppTheme = (mode: 'light' | 'dark', appearanceSettings?: Partial<AppearanceSettings>): Theme => {
  const baseTheme = mode === 'dark' ? darkThemeOptions : lightThemeOptions;
  
  if (!appearanceSettings) {
    return mode === 'dark' ? darkTheme : lightTheme;
  }

  const fontScale = getFontSizeScale(appearanceSettings.fontSize || 'medium');
  const baseFontFamily = typeof baseTheme.typography === 'object' && baseTheme.typography ? 
    (baseTheme.typography as any).fontFamily : '"Roboto", "Helvetica Neue", "Helvetica", "Arial", sans-serif';
  const customFontFamily = appearanceSettings.fontFamily || baseFontFamily;

  const enhancedThemeOptions: ThemeOptions = {
    ...baseTheme,
    typography: {
      ...baseTheme.typography,
      fontFamily: customFontFamily,
      h1: {
        ...(baseTheme.typography as any)?.h1,
        fontSize: `${2 * fontScale}rem`,
      },
      h2: {
        ...(baseTheme.typography as any)?.h2,
        fontSize: `${1.5 * fontScale}rem`,
      },
      h3: {
        ...(baseTheme.typography as any)?.h3,
        fontSize: `${1.25 * fontScale}rem`,
      },
      h4: {
        fontSize: `${1.1 * fontScale}rem`,
        fontWeight: 600,
      },
      h5: {
        fontSize: `${1 * fontScale}rem`,
        fontWeight: 600,
      },
      h6: {
        fontSize: `${0.875 * fontScale}rem`,
        fontWeight: 600,
      },
      body1: {
        ...(baseTheme.typography as any)?.body1,
        fontSize: `${1 * fontScale}rem`,
      },
      body2: {
        ...(baseTheme.typography as any)?.body2,
        fontSize: `${0.875 * fontScale}rem`,
      },
      button: {
        fontSize: `${0.875 * fontScale}rem`,
      },
      caption: {
        fontSize: `${0.75 * fontScale}rem`,
      }
    }
  };

  return createTheme(enhancedThemeOptions);
};

// Default export for backward compatibility
export default lightTheme;