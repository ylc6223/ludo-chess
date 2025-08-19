import { Cell, BoardData, BoardDimensions, CellType } from '../types/board';

class BoardDataService {
  private static instance: BoardDataService;
  private cachedBoardData: BoardData | null = null;

  public static getInstance(): BoardDataService {
    if (!BoardDataService.instance) {
      BoardDataService.instance = new BoardDataService();
    }
    return BoardDataService.instance;
  }

  public createBoardData(dimensions?: Partial<BoardDimensions>): BoardData {
    const defaultDimensions: BoardDimensions = {
      rows: 17,
      cols: 17,
      cellSize: 40,
      gap: 20
    };

    const finalDimensions = { ...defaultDimensions, ...dimensions };

    // 使用缓存避免重复计算
    if (this.cachedBoardData && JSON.stringify(this.cachedBoardData.dimensions) === JSON.stringify(finalDimensions)) {
      return this.cachedBoardData;
    }

    const cells = this.generateCells(finalDimensions.rows, finalDimensions.cols);
    this.setupPlayerAreas(cells);
    this.setupSpecialPositions(cells);

    const boardData: BoardData = {
      cells,
      connections: [], // 将在connectionService中生成
      dimensions: finalDimensions
    };

    this.cachedBoardData = boardData;
    return boardData;
  }

  private generateCells(rows: number, cols: number): Cell[][] {
    const cells: Cell[][] = [];
    
    for (let row = 0; row < rows; row++) {
      cells[row] = [];
      for (let col = 0; col < cols; col++) {
        cells[row][col] = {
          type: 'empty',
          row,
          col,
          hasRailway: false,
          connections: []
        };
      }
    }
    
    return cells;
  }

  private setupPlayerAreas(cells: Cell[][]): void {
    // 上方区域 (绿色玩家)
    for (let row = 0; row < 6; row++) {
      for (let col = 6; col < 11; col++) {
        cells[row][col].type = 'player-green';
      }
    }

    // 下方区域 (黄色玩家)
    for (let row = 11; row < 17; row++) {
      for (let col = 6; col < 11; col++) {
        cells[row][col].type = 'player-yellow';
      }
    }

    // 左侧区域 (红色玩家)
    for (let row = 6; row < 11; row++) {
      for (let col = 0; col < 6; col++) {
        cells[row][col].type = 'player-red';
      }
    }

    // 右侧区域 (蓝色玩家)
    for (let row = 6; row < 11; row++) {
      for (let col = 11; col < 17; col++) {
        cells[row][col].type = 'player-blue';
      }
    }

    // 中央公共区域
    this.setupCentralArea(cells);
  }

  private setupCentralArea(cells: Cell[][]): void {
    for (let row = 6; row < 11; row++) {
      for (let col = 6; col < 11; col++) {
        // 跳过空行空列
        if ((row === 7 || row === 9) || (col === 7 || col === 9)) {
          cells[row][col].type = 'empty';
        } else {
          cells[row][col].type = 'normal';
        }
      }
    }
  }

  private setupSpecialPositions(cells: Cell[][]): void {
    // 大本营入口位置
    const entrancePositions = [
      [0, 7], [0, 9], // 绿方
      [16, 7], [16, 9], // 黄方
      [7, 0], [9, 0], // 红方
      [7, 16], [9, 16] // 蓝方
    ];

    entrancePositions.forEach(([row, col]) => {
      if (cells[row] && cells[row][col]) {
        cells[row][col].type = 'entrance';
      }
    });

    // 军营位置，按玩家分组
    const campPositions = [
      // 绿方军营
      { positions: [[4, 7], [4, 9], [3, 8], [2, 7], [2, 9]], type: 'camp-green' },
      // 黄方军营
      { positions: [[12, 7], [12, 9], [13, 8], [14, 7], [14, 9]], type: 'camp-yellow' },
      // 红方军营
      { positions: [[7, 4], [9, 4], [8, 3], [7, 2], [9, 2]], type: 'camp-red' },
      // 蓝方军营
      { positions: [[7, 12], [9, 12], [8, 13], [7, 14], [9, 14]], type: 'camp-blue' }
    ];

    campPositions.forEach(({ positions, type }) => {
      positions.forEach(([row, col]) => {
        if (cells[row] && cells[row][col]) {
          cells[row][col].type = type as CellType;
        }
      });
    });
  }

  public clearCache(): void {
    this.cachedBoardData = null;
  }
}

export const boardDataService = BoardDataService.getInstance();