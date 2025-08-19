import React, { memo } from 'react';
import { Cell } from '../../types/board';
import { BoardConfig } from '../../config/boardConfig';

interface BoardCellProps {
  cell: Cell;
  config: BoardConfig;
  style?: React.CSSProperties;
  onClick?: (row: number, col: number) => void;
}

const BoardCell: React.FC<BoardCellProps> = memo(({ cell, config, style, onClick }) => {
  const getCellClassName = (): string => {
    let className = 'chess-cell';
    
    switch (cell.type) {
      case 'empty':
        className += ' empty';
        break;
      case 'normal':
        className += ' normal';
        break;
      case 'player-red':
        className += ' player-red';
        break;
      case 'player-green':
        className += ' player-green';
        break;
      case 'player-blue':
        className += ' player-blue';
        break;
      case 'player-yellow':
        className += ' player-yellow';
        break;
      case 'camp':
        className += ' camp';
        if (!config.visibility.showCamps) {
          className += ' hidden';
        }
        break;
      case 'entrance':
        className += ' entrance';
        if (!config.visibility.showEntrances) {
          className += ' hidden';
        }
        break;
      case 'headquarters':
        className += ' headquarters';
        break;
    }

    return className;
  };

  const getCellStyle = (): React.CSSProperties => {
    const cellStyleKey = (() => {
      switch (cell.type) {
        case 'empty': return 'empty';
        case 'normal': return 'normal';
        case 'player-red': return 'playerRed';
        case 'player-green': return 'playerGreen';
        case 'player-blue': return 'playerBlue';
        case 'player-yellow': return 'playerYellow';
        case 'camp': return 'camp';
        case 'entrance': return 'entrance';
        case 'headquarters': return 'headquarters';
        default: return 'normal';
      }
    })() as keyof typeof config.cellStyles;

    const styleConfig = config.cellStyles[cellStyleKey];
    let baseStyle: React.CSSProperties = {
      background: styleConfig.background,
      color: styleConfig.color,
      border: styleConfig.border,
      boxShadow: styleConfig.boxShadow,
      borderRadius: cell.type === 'camp' ? '50%' : '4px',
      ...style
    };
    
    // 应用可见性设置
    if (cell.type === 'camp' && !config.visibility.showCamps) {
      baseStyle.background = 'transparent';
      baseStyle.color = 'transparent';
    } else if (cell.type === 'entrance' && !config.visibility.showEntrances) {
      baseStyle.background = 'transparent';
      baseStyle.color = 'transparent';
    } else if (!config.visibility.showCells && cell.type !== 'empty' && cell.type !== 'camp' && cell.type !== 'entrance') {
      baseStyle.background = 'transparent';
      baseStyle.color = 'transparent';
    }
    
    if (!config.visibility.showBorders) {
      baseStyle.border = 'none';
      baseStyle.boxShadow = 'none';
    }
    
    return baseStyle;
  };

  const renderEntranceTriangle = (): React.ReactNode => {
    if (cell.type === 'entrance' && config.visibility.showEntrances) {
      return (
        <div className="w-0 h-0 border-l-2 border-r-2 border-b-3 border-l-transparent border-r-transparent border-b-white"></div>
      );
    }
    return null;
  };

  const handleClick = () => {
    if (onClick) {
      onClick(cell.row, cell.col);
    }
  };

  return (
    <div
      className={getCellClassName()}
      style={getCellStyle()}
      onClick={handleClick}
    >
      {renderEntranceTriangle()}
    </div>
  );
});

BoardCell.displayName = 'BoardCell';

export default BoardCell;