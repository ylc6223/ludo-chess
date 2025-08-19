// 棋盘相关类型定义
export type CellType = 'empty' | 'normal' | 'player-red' | 'player-green' | 'player-blue' | 'player-yellow' | 'camp' | 'camp-red' | 'camp-green' | 'camp-blue' | 'camp-yellow' | 'headquarters' | 'entrance';

export interface Cell {
  type: CellType;
  row: number;
  col: number;
  hasRailway?: boolean;
  connections?: string[];
}

export interface Position {
  row: number;
  col: number;
}

export interface Connection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  key: string;
  stroke?: string;
}

export interface BoardDimensions {
  rows: number;
  cols: number;
  cellSize: number;
  gap: number;
}

export interface BoardData {
  cells: Cell[][];
  connections: Connection[];
  dimensions: BoardDimensions;
}