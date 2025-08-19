import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { BoardConfig, defaultBoardConfig } from '../config/boardConfig';

interface ConfigContextType {
  config: BoardConfig;
  updateCellStyle: (cellType: string, styleKey: string, value: string) => void;
  updateVisibility: (key: keyof BoardConfig['visibility']) => void;
  updateConnectionStyle: (key: keyof BoardConfig['connectionStyle'], value: any) => void;
  resetToDefault: () => void;
  exportConfig: () => string;
  importConfig: (configString: string) => boolean;
}

type ConfigAction = 
  | { type: 'UPDATE_CELL_STYLE'; payload: { cellType: string; styleKey: string; value: string } }
  | { type: 'UPDATE_VISIBILITY'; payload: keyof BoardConfig['visibility'] }
  | { type: 'UPDATE_CONNECTION_STYLE'; payload: { key: keyof BoardConfig['connectionStyle']; value: any } }
  | { type: 'RESET_CONFIG' }
  | { type: 'IMPORT_CONFIG'; payload: BoardConfig };

const configReducer = (state: BoardConfig, action: ConfigAction): BoardConfig => {
  switch (action.type) {
    case 'UPDATE_CELL_STYLE':
      const { cellType, styleKey, value } = action.payload;
      const cellStyleKey = cellType as keyof typeof state.cellStyles;
      
      if (state.cellStyles[cellStyleKey]) {
        return {
          ...state,
          cellStyles: {
            ...state.cellStyles,
            [cellStyleKey]: {
              ...state.cellStyles[cellStyleKey],
              [styleKey]: value
            }
          }
        };
      }
      return state;

    case 'UPDATE_VISIBILITY':
      return {
        ...state,
        visibility: {
          ...state.visibility,
          [action.payload]: !state.visibility[action.payload]
        }
      };

    case 'UPDATE_CONNECTION_STYLE':
      return {
        ...state,
        connectionStyle: {
          ...state.connectionStyle,
          [action.payload.key]: action.payload.value
        }
      };

    case 'RESET_CONFIG':
      return defaultBoardConfig;

    case 'IMPORT_CONFIG':
      return action.payload;

    default:
      return state;
  }
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [config, dispatch] = useReducer(configReducer, defaultBoardConfig);

  const updateCellStyle = (cellType: string, styleKey: string, value: string) => {
    dispatch({ type: 'UPDATE_CELL_STYLE', payload: { cellType, styleKey, value } });
  };

  const updateVisibility = (key: keyof BoardConfig['visibility']) => {
    dispatch({ type: 'UPDATE_VISIBILITY', payload: key });
  };

  const updateConnectionStyle = (key: keyof BoardConfig['connectionStyle'], value: any) => {
    dispatch({ type: 'UPDATE_CONNECTION_STYLE', payload: { key, value } });
  };

  const resetToDefault = () => {
    dispatch({ type: 'RESET_CONFIG' });
  };

  const exportConfig = (): string => {
    return JSON.stringify(config, null, 2);
  };

  const importConfig = (configString: string): boolean => {
    try {
      const importedConfig = JSON.parse(configString);
      // 验证配置结构
      if (importedConfig && typeof importedConfig === 'object') {
        dispatch({ type: 'IMPORT_CONFIG', payload: importedConfig });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import config:', error);
      return false;
    }
  };

  const value: ConfigContextType = {
    config,
    updateCellStyle,
    updateVisibility,
    updateConnectionStyle,
    resetToDefault,
    exportConfig,
    importConfig
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};