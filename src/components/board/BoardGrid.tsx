import React, { memo } from 'react';
import { BoardData } from '../../types/board';
import { BoardConfig } from '../../config/boardConfig';
import BoardCell from './BoardCell';

interface BoardGridProps {
  boardData: BoardData;
  config: BoardConfig;
  onCellClick?: (row: number, col: number) => void;
}

const BoardGrid: React.FC<BoardGridProps> = memo(({ boardData, config, onCellClick }) => {
  return (
    <div className="chess-board-17">
      {boardData.cells.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <BoardCell
            key={`${rowIndex}-${colIndex}`}
            cell={cell}
            config={config}
            style={{
              gridRow: rowIndex + 1,
              gridColumn: colIndex + 1
            }}
            onClick={onCellClick}
          />
        ))
      )}
    </div>
  );
});

BoardGrid.displayName = 'BoardGrid';

export default BoardGrid;