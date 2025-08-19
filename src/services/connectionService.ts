import { Connection, BoardData } from '../types/board';

class ConnectionService {
  private static instance: ConnectionService;
  private cachedConnections: Map<string, Connection[]> = new Map();

  public static getInstance(): ConnectionService {
    if (!ConnectionService.instance) {
      ConnectionService.instance = new ConnectionService();
    }
    return ConnectionService.instance;
  }

  public generateConnections(boardData: BoardData): Connection[] {
    const { cells, dimensions } = boardData;
    const { cellSize, gap } = dimensions;
    
    // 创建缓存键
    const cacheKey = this.createCacheKey(boardData);
    if (this.cachedConnections.has(cacheKey)) {
      return this.cachedConnections.get(cacheKey)!;
    }

    const connections: Connection[] = [];

    // 生成各种类型的连接线
    this.generateBasicConnections(cells, cellSize, gap, connections);
    this.generateCentralConnections(cellSize, gap, connections);
    this.generateCampDiagonalConnections(cells, cellSize, gap, connections);
    this.generateBoundaryConnections(cells, cellSize, gap, connections);

    // 缓存结果
    this.cachedConnections.set(cacheKey, connections);
    console.log(`✅ 生成连接线: ${connections.length} 条`);
    return connections;
  }

  private createCacheKey(boardData: BoardData): string {
    const { dimensions } = boardData;
    return `${dimensions.rows}x${dimensions.cols}_${dimensions.cellSize}_${dimensions.gap}`;
  }

  private generateBasicConnections(
    cells: any[][], 
    cellSize: number, 
    gap: number, 
    connections: Connection[]
  ): void {
    let basicConnectionCount = 0;
    
    for (let row = 0; row < cells.length; row++) {
      for (let col = 0; col < cells[row].length; col++) {
        const cell = cells[row][col];
        
        if (cell.type !== 'empty') {
          const cellCenterX = col * (cellSize + gap) + cellSize / 2;
          const cellCenterY = row * (cellSize + gap) + cellSize / 2;
          
          // 右侧连接
          if (col < cells[row].length - 1 && cells[row][col + 1].type !== 'empty') {
            const targetCenterX = (col + 1) * (cellSize + gap) + cellSize / 2;
            
            connections.push({
              x1: cellCenterX,
              y1: cellCenterY,
              x2: targetCenterX,
              y2: cellCenterY,
              key: `h-${row}-${col}`
            });
            basicConnectionCount++;
          }
          
          // 下方连接
          if (row < cells.length - 1 && cells[row + 1][col].type !== 'empty') {
            const targetCenterY = (row + 1) * (cellSize + gap) + cellSize / 2;
            
            connections.push({
              x1: cellCenterX,
              y1: cellCenterY,
              x2: cellCenterX,
              y2: targetCenterY,
              key: `v-${row}-${col}`
            });
            basicConnectionCount++;
          }
        }
      }
    }
    
  }

  private generateCentralConnections(
    cellSize: number, 
    gap: number, 
    connections: Connection[]
  ): void {
    const centralPositions = [
      [6, 6], [6, 8], [6, 10],
      [8, 6], [8, 8], [8, 10],
      [10, 6], [10, 8], [10, 10]
    ];
    
    centralPositions.forEach(([row, col], index) => {
      const cellCenterX = col * (cellSize + gap) + cellSize / 2;
      const cellCenterY = row * (cellSize + gap) + cellSize / 2;
      
      // 水平连接
      if (index % 3 < 2) {
        const nextCol = centralPositions[index + 1][1];
        const nextCellCenterX = nextCol * (cellSize + gap) + cellSize / 2;
        
        connections.push({
          x1: cellCenterX,
          y1: cellCenterY,
          x2: nextCellCenterX,
          y2: cellCenterY,
          key: `central-h-${index}`
        });
      }
      
      // 垂直连接
      if (index < 6) {
        const nextRow = centralPositions[index + 3][0];
        const nextCellCenterY = nextRow * (cellSize + gap) + cellSize / 2;
        
        connections.push({
          x1: cellCenterX,
          y1: cellCenterY,
          x2: cellCenterX,
          y2: nextCellCenterY,
          key: `central-v-${index}`
        });
      }
    });
  }

  private generateCampDiagonalConnections(
    cells: any[][], 
    cellSize: number, 
    gap: number, 
    connections: Connection[]
  ): void {
    // 军营8个方向连接：4个对角线 + 4个正交方向
    const allDirections = [
      [-1, -1], [-1, 0], [-1, 1],  // 上方三个方向
      [0, -1],           [0, 1],   // 左右方向  
      [1, -1],  [1, 0],  [1, 1]    // 下方三个方向
    ];

    for (let row = 0; row < cells.length; row++) {
      for (let col = 0; col < cells[row].length; col++) {
        const cell = cells[row][col];
        
        // 只有军营格子才生成8方向连接
        if (this.isCampCell(cell.type)) {
          allDirections.forEach(([dRow, dCol]) => {
            const targetRow = row + dRow;
            const targetCol = col + dCol;
            
            if (cells[targetRow] && cells[targetRow][targetCol] &&
                cells[targetRow][targetCol].type !== 'empty') {
              
              const fromCenterX = col * (cellSize + gap) + cellSize / 2;
              const fromCenterY = row * (cellSize + gap) + cellSize / 2;
              const toCenterX = targetCol * (cellSize + gap) + cellSize / 2;
              const toCenterY = targetRow * (cellSize + gap) + cellSize / 2;
              
              connections.push({
                x1: fromCenterX,
                y1: fromCenterY,
                x2: toCenterX,
                y2: toCenterY,
                key: `camp-all-directions-${row}-${col}-${targetRow}-${targetCol}`
              });
            }
          });
        }
      }
    }
  }

  private generateBoundaryConnections(
    cells: any[][], 
    cellSize: number, 
    gap: number, 
    connections: Connection[]
  ): void {
    const boundaryConnections = [
      { from: [5, 6], to: [6, 5] },
      { from: [5, 10], to: [6, 11] },
      { from: [6, 5], to: [5, 6] },
      { from: [10, 5], to: [11, 6] },
      { from: [6, 11], to: [5, 10] },
      { from: [10, 11], to: [11, 10] },
      { from: [11, 6], to: [10, 5] },
      { from: [11, 10], to: [10, 11] }
    ];
    
    boundaryConnections.forEach(({ from, to }, index) => {
      const [fromRow, fromCol] = from;
      const [toRow, toCol] = to;
      
      if (cells[fromRow] && cells[fromRow][fromCol] && 
          cells[toRow] && cells[toRow][toCol] &&
          cells[fromRow][fromCol].type !== 'empty' && 
          cells[toRow][toCol].type !== 'empty') {
        
        const fromCenterX = fromCol * (cellSize + gap) + cellSize / 2;
        const fromCenterY = fromRow * (cellSize + gap) + cellSize / 2;
        const toCenterX = toCol * (cellSize + gap) + cellSize / 2;
        const toCenterY = toRow * (cellSize + gap) + cellSize / 2;
        
        connections.push({
          x1: fromCenterX,
          y1: fromCenterY,
          x2: toCenterX,
          y2: toCenterY,
          key: `boundary-${index}`
        });
      }
    });
  }

  private isCampCell(cellType: string): boolean {
    return cellType === 'camp' || 
           cellType === 'camp-red' || 
           cellType === 'camp-green' || 
           cellType === 'camp-blue' || 
           cellType === 'camp-yellow';
  }

  public clearCache(): void {
    this.cachedConnections.clear();
  }
}

export const connectionService = ConnectionService.getInstance();