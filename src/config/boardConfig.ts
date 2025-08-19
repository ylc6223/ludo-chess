// 四国军棋棋盘配置文件
export interface CellStyle {
  background: string;
  color: string;
  border: string;
  boxShadow?: string;
}

export interface BoardConfig {
  // 棋盘基础设置
  cellSize: number;
  gap: number;
  
  // 单元格样式配置
  cellStyles: {
    empty: CellStyle;
    normal: CellStyle;
    playerRed: CellStyle;
    playerGreen: CellStyle;
    playerBlue: CellStyle;
    playerYellow: CellStyle;
    camp: CellStyle;
    campRed: CellStyle;
    campGreen: CellStyle;
    campBlue: CellStyle;
    campYellow: CellStyle;
    entrance: CellStyle;
    headquarters: CellStyle;
  };
  
  // 连接线配置
  connectionStyle: {
    stroke: string;
    strokeWidth: number;
    opacity: number;
  };
  
  // 工具栏配置
  toolbar: {
    width: number;
    backgroundColor: string;
    borderColor: string;
  };

  // 可见性配置
  visibility: {
    showCells: boolean;      // 是否显示普通单元格
    showCamps: boolean;      // 是否显示军营
    showEntrances: boolean;  // 是否显示大本营
    showBorders: boolean;    // 是否显示边框
    showConnections: boolean; // 是否显示连接线
    showCoordinates: boolean; // 是否显示坐标
    showPieces: boolean;     // 是否显示棋子
  };
}

// 默认配置
export const defaultBoardConfig: BoardConfig = {
  cellSize: 40,
  gap: 20,
  
  cellStyles: {
    empty: {
      background: 'transparent',
      color: 'transparent',
      border: 'none'
    },
    normal: {
      background: '#F5F5F5',
      color: '#333333',
      border: '1px solid #666666',
      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)'
    },
    playerRed: {
      background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
      color: 'white',
      border: '1px solid #B71C1C',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)'
    },
    playerGreen: {
      background: 'linear-gradient(135deg, #43A047 0%, #2E7D32 100%)',
      color: 'white',
      border: '1px solid #1B5E20',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)'
    },
    playerBlue: {
      background: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
      color: 'white',
      border: '1px solid #0D47A1',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)'
    },
    playerYellow: {
      background: 'linear-gradient(135deg, #FDD835 0%, #F9A825 100%)',
      color: 'black',
      border: '1px solid #F57F17',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 1px 3px rgba(0, 0, 0, 0.15)'
    },
    camp: {
      background: '#F8F8F8',
      color: '#333333',
      border: '2px solid #424242',
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.2)'
    },
    campRed: {
      background: 'linear-gradient(135deg, #FFCDD2 0%, #EF9A9A 100%)',
      color: '#B71C1C',
      border: '2px solid #C62828',
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.2)'
    },
    campGreen: {
      background: 'linear-gradient(135deg, #C8E6C9 0%, #A5D6A7 100%)',
      color: '#1B5E20',
      border: '2px solid #2E7D32',
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.2)'
    },
    campBlue: {
      background: 'linear-gradient(135deg, #BBDEFB 0%, #90CAF9 100%)',
      color: '#0D47A1',
      border: '2px solid #1565C0',
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.2)'
    },
    campYellow: {
      background: 'linear-gradient(135deg, #FFF9C4 0%, #FFF59D 100%)',
      color: '#F57F17',
      border: '2px solid #F9A825',
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.2)'
    },
    entrance: {
      background: '#F8F8F8',
      color: '#43A047',
      border: '2px solid #424242',
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.2)'
    },
    headquarters: {
      background: '#E0E0E0',
      color: '#424242',
      border: '3px solid #424242',
      boxShadow: 'inset 0 0 0 2px rgba(66, 66, 66, 0.3)'
    }
  },
  
  connectionStyle: {
    // stroke: '#666666', // 中等灰色
    stroke: '#000', // 中等灰色
    strokeWidth: 1,    // 细线条
    // opacity: 0.6       // 适中的透明度，既可见又不突出
    opacity: 1       // 适中的透明度，既可见又不突出
  },
  
  toolbar: {
    width: 300,
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e0'
  },

  // 默认可见性设置
  visibility: {
    showCells: true,
    showCamps: true,
    showEntrances: true,
    showBorders: true,
    showConnections: true,
    showCoordinates: false,
    showPieces: true
  }
};

// 颜色预设选项
export const colorPresets = {
  red: ['#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C'],
  green: ['#E8F5E8', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20'],
  blue: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1'],
  yellow: ['#FFFDE7', '#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58', '#FFEB3B', '#FDD835', '#FBC02D', '#F9A825', '#F57F17'],
  gray: ['#FAFAFA', '#F5F5F5', '#EEEEEE', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121']
};