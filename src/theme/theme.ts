import { createTheme, Theme, ThemeOptions } from '@mui/material/styles';
import { AppearanceSettings, FontSize } from '../types/settings';

// Font size scale based on setting
const getFontSizeScale = (fontSize: FontSize): number => {
  switch (fontSize) {
    case 'small': return 0.875;
    case 'large': return 1.125;
    case 'medium':
    default: return 1;
  }
};

// Spacing scale based on compact mode (currently unused)
// const getSpacingScale = (compactMode: boolean): number => {
//   return compactMode ? 0.75 : 1;
// };

// Light theme configuration
const lightThemeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: '#2c3e50',
      light: '#34495e',
      dark: '#1a252f'
    },
    secondary: {
      main: '#3498db',
      light: '#5dade2',
      dark: '#2980b9'
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff'
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
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
          backgroundColor: '#2c3e50'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#f8fafc',
          borderRight: '1px solid #e2e8f0'
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
      main: '#3498db',
      light: '#5dade2',
      dark: '#2980b9'
    },
    secondary: {
      main: '#e74c3c',
      light: '#ec7063',
      dark: '#c0392b'
    },
    background: {
      default: '#1e1e1e',
      paper: '#2d2d2d'
    },
    text: {
      primary: '#ffffff',
      secondary: '#e0e0e0'
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#ffffff'
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#ffffff'
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#ffffff'
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#ffffff'
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#e0e0e0'
    }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#2d2d2d',
          borderRight: '1px solid #404040'
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
          backgroundColor: '#2d2d2d'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#404040'
            },
            '&:hover fieldset': {
              borderColor: '#3498db'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3498db'
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
  // const spacingScale = getSpacingScale(appearanceSettings.compactMode || false);
  const baseFontFamily = typeof baseTheme.typography === 'object' && baseTheme.typography ? 
    (baseTheme.typography as any).fontFamily : '"Roboto", "Helvetica", "Arial", sans-serif';
  const customFontFamily = appearanceSettings.fontFamily || baseFontFamily;

  const enhancedThemeOptions: ThemeOptions = {
    ...baseTheme,
    // Note: spacing removed as it breaks MUI - implement compactMode differently
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