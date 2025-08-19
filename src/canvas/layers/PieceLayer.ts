/**
 * 棋子渲染层
 * 负责在棋盘上渲染所有棋子
 */

import { ICanvasLayer, Point, Rectangle, Drawable } from '../../types/canvas';
import { BoardData } from '../../types/board';
import { BoardConfig } from '../../config/boardConfig';
import { GameEngine } from '../../game/core/GameEngine';
import { GamePiece, PlayerColor, PIECE_NAMES } from '../../game/pieces/PieceTypes';
import { BoardLayer } from './BoardLayer';

export class PieceLayer implements ICanvasLayer {
  readonly name = 'pieces';
  readonly zIndex = 2; // 棋子在最上层
  visible = true;

  private boardData: BoardData;
  private _config: BoardConfig;
  private gameEngine: GameEngine;
  private _isDirty = true;

  constructor(boardData: BoardData, config: BoardConfig) {
    this.boardData = boardData;
    this._config = config;
    this.gameEngine = new GameEngine();
    this.initializeGame();
  }

  /**
   * 初始化游戏并固定摆放棋子
   */
  private initializeGame(): void {
    this.gameEngine.initializePieces();
    this.deployPiecesFixed();
  }

  /**
   * 行营格子坐标（这些位置不摆放棋子）- 按逆时针重新排列
   */
  private readonly campPositions = [
    // 红方行营（右侧）
    [7, 12], [9, 12], [8, 13], [7, 14], [9, 14],
    // 绿方行营（上方）
    [2, 7], [2, 9], [3, 8], [4, 7], [4, 9],
    // 蓝方行营（左侧）
    [7, 2], [9, 2], [8, 3], [7, 4], [9, 4],
    // 黄方行营（下方）
    [12, 7], [12, 9], [13, 8], [14, 7], [14, 9]
  ];

  /**
   * 判断某个位置是否是行营
   */
  private isCampPosition(row: number, col: number): boolean {
    return this.campPositions.some(([campRow, campCol]) =>
      campRow === row && campCol === col
    );
  }

  /**
   * 固定方案摆放棋子 - 恢复完整区域但排除军营格子位置
   */
  private deployPiecesFixed(): void {

    // 判断位置是否在中央交汇区域（防止越界）
    const isCentralArea = (row: number, col: number): boolean => {
      return (row >= 6 && row <= 10) && (col >= 6 && col <= 10);
    };

    // 大本营位置（军旗必须摆放在这里）- 按照标准四国军棋规则，每个玩家有两个大本营
    const getHeadquartersPositions = (playerColor: PlayerColor): [number, number][] => {
      switch (playerColor) {
        case PlayerColor.Red:
          // 红方右侧区域，两个大本营位置
          return [[7, 16], [9, 16]];  // 行7列16 和 行9列16
        case PlayerColor.Green:
          // 绿方上方区域，两个大本营位置
          return [[0, 7], [0, 9]];    // 行0列7 和 行0列9
        case PlayerColor.Blue:
          // 蓝方左侧区域，两个大本营位置
          return [[7, 0], [9, 0]];    // 行7列0 和 行9列0
        case PlayerColor.Yellow:
          // 黄方下方区域，两个大本营位置
          return [[16, 7], [16, 9]];  // 行16列7 和 行16列9
        default:
          return [];
      }
    };

    // 获取玩家区域的所有有效位置，排除军营、中央区域和大本营
    const getAllPlayerPositions = (regions: {startRow: number, endRow: number, startCol: number, endCol: number}[], playerColor: PlayerColor) => {
      const positions: [number, number][] = [];
      // 获取大本营位置用于排除
      const headquartersPositions = getHeadquartersPositions(playerColor);
      const hqSet = new Set(headquartersPositions.map(([r, c]: [number, number]) => `${r},${c}`));
      
      regions.forEach(region => {
        for (let row = region.startRow; row <= region.endRow; row++) {
          for (let col = region.startCol; col <= region.endCol; col++) {
            // 排除行营、中央区域、大本营和超出边界的位置
            if (!this.isCampPosition(row, col) &&
                !isCentralArea(row, col) &&
                !hqSet.has(`${row},${col}`) &&
                row >= 0 && row <= 16 && col >= 0 && col <= 16) {
              // 根据玩家颜色限制区域
              if (isValidPlayerPosition(row, col, playerColor)) {
                positions.push([row, col]);
              }
            }
          }
        }
      });
      return positions;
    };

    // 判断位置是否属于指定玩家的有效区域（包含大本营位置）
    const isValidPlayerPosition = (row: number, col: number, playerColor: PlayerColor): boolean => {
      switch (playerColor) {
        case PlayerColor.Red:
          // 红方右侧区域，大本营在(8,15)
          return row >= 6 && row <= 10 && col >= 11 && col <= 16;
        case PlayerColor.Green:
          // 绿方上方区域，大本营在(1,8)
          return row >= 0 && row <= 5 && col >= 6 && col <= 10;
        case PlayerColor.Blue:
          // 蓝方左侧区域，大本营在(8,1)
          return row >= 6 && row <= 10 && col >= 0 && col <= 5;
        case PlayerColor.Yellow:
          // 黄方下方区域，大本营在(15,8)
          return row >= 11 && row <= 16 && col >= 6 && col <= 10;
        default:
          return false;
      }
    };

    // 修正后的摆放区域，确保不越界 - 按逆时针重新排列
    const deploymentAreas = {
      [PlayerColor.Red]: {
        positions: getAllPlayerPositions([
          {startRow: 6, endRow: 10, startCol: 11, endCol: 16} // 红方右侧区域
        ], PlayerColor.Red)
      },
      [PlayerColor.Green]: {
        positions: getAllPlayerPositions([
          {startRow: 0, endRow: 5, startCol: 6, endCol: 10}   // 绿方上方区域
        ], PlayerColor.Green)
      },
      [PlayerColor.Blue]: {
        positions: getAllPlayerPositions([
          {startRow: 6, endRow: 10, startCol: 0, endCol: 5}   // 蓝方左侧区域
        ], PlayerColor.Blue)
      },
      [PlayerColor.Yellow]: {
        positions: getAllPlayerPositions([
          {startRow: 11, endRow: 16, startCol: 6, endCol: 10} // 黄方下方区域
        ], PlayerColor.Yellow)
      }
    };

    const gameState = this.gameEngine.getGameState();
    gameState.players.forEach((player, color) => {
      const area = deploymentAreas[color];

      const colorName = color === PlayerColor.Red ? '红' : 
                       color === PlayerColor.Green ? '绿' : 
                       color === PlayerColor.Blue ? '蓝' : '黄';
      console.log(`${colorName}方可用位置数量: ${area.positions.length}`);
      console.log(`${colorName}方棋子数量: ${player.pieces.length}`);
      
      // 调试：输出前几个位置坐标
      console.log(`${colorName}方前5个摆放位置:`, area.positions.slice(0, 5));
      console.log(`${colorName}方后5个摆放位置:`, area.positions.slice(-5));

      // 根据特殊棋子规则分类摆放
      this.deployPiecesWithRules(player, area.positions, gameState.board, color);
    });

    this.markDirty();
  }

  /**
   * 按照规则摆放棋子（特殊棋子有位置限制）
   */
  private deployPiecesWithRules(
    player: any, 
    availablePositions: [number, number][], 
    board: any[][], 
    color: PlayerColor
  ): void {
    // 大本营位置（军旗必须摆放在这里）- 按照标准四国军棋规则，每个玩家有两个大本营
    const getHeadquartersPositions = (playerColor: PlayerColor): [number, number][] => {
      switch (playerColor) {
        case PlayerColor.Red:
          // 红方右侧区域，两个大本营位置
          return [[7, 16], [9, 16]];  // 行7列16 和 行9列16
        case PlayerColor.Green:
          // 绿方上方区域，两个大本营位置
          return [[0, 7], [0, 9]];    // 行0列7 和 行0列9
        case PlayerColor.Blue:
          // 蓝方左侧区域，两个大本营位置
          return [[7, 0], [9, 0]];    // 行7列0 和 行9列0
        case PlayerColor.Yellow:
          // 黄方下方区域，两个大本营位置
          return [[16, 7], [16, 9]];  // 行16列7 和 行16列9
        default:
          return [];
      }
    };

    // 获取最后两排位置（地雷专用位置，排除军旗位置）
    const getLastTwoRowsPositions = (playerColor: PlayerColor): [number, number][] => {
      const lastTwoRows: [number, number][] = [];
      const headquartersPos = getHeadquartersPositions(playerColor);
      const hqSet = new Set(headquartersPos.map(([r, c]: [number, number]) => `${r},${c}`));
      
      switch (playerColor) {
        case PlayerColor.Red:
          // 红方最后两列（列15, 16），排除大本营位置
          for (let row = 6; row <= 10; row++) {
            for (let col = 15; col <= 16; col++) {
              if (!hqSet.has(`${row},${col}`) && !this.isCampPosition(row, col)) {
                lastTwoRows.push([row, col]);
              }
            }
          }
          break;
        case PlayerColor.Green:
          // 绿方最后两行（行0, 1），排除大本营位置
          for (let row = 0; row <= 1; row++) {
            for (let col = 6; col <= 10; col++) {
              if (!hqSet.has(`${row},${col}`) && !this.isCampPosition(row, col)) {
                lastTwoRows.push([row, col]);
              }
            }
          }
          break;
        case PlayerColor.Blue:
          // 蓝方最后两列（列0, 1），排除大本营位置
          for (let row = 6; row <= 10; row++) {
            for (let col = 0; col <= 1; col++) {
              if (!hqSet.has(`${row},${col}`) && !this.isCampPosition(row, col)) {
                lastTwoRows.push([row, col]);
              }
            }
          }
          break;
        case PlayerColor.Yellow:
          // 黄方最后两行（行15, 16），排除大本营位置
          for (let row = 15; row <= 16; row++) {
            for (let col = 6; col <= 10; col++) {
              if (!hqSet.has(`${row},${col}`) && !this.isCampPosition(row, col)) {
                lastTwoRows.push([row, col]);
              }
            }
          }
          break;
      }
      return lastTwoRows;
    };

    // 按距离中心排序，远离中心的位置在后面
    const sortedPositions = [...availablePositions].sort((a, b) => {
      const centerRow = 8, centerCol = 8;
      const distA = Math.abs(a[0] - centerRow) + Math.abs(a[1] - centerCol);
      const distB = Math.abs(b[0] - centerRow) + Math.abs(b[1] - centerCol);
      return distA - distB; // 近的在前，远的在后
    });

    // 分类棋子
    const flagPieces = player.pieces.filter((p: any) => p.type === 'Flag');
    const minePieces = player.pieces.filter((p: any) => p.type === 'Mine');
    const bombPieces = player.pieces.filter((p: any) => p.type === 'Bomb');
    const normalPieces = player.pieces.filter((p: any) => 
      p.type !== 'Mine' && p.type !== 'Flag' && p.type !== 'Bomb'
    );

    let positionIndex = 0;

    // 1. 首先摆放军旗在大本营位置（强制摆放，忽略availablePositions限制）
    const headquartersPositions = getHeadquartersPositions(color);
    const debugColorName = color === PlayerColor.Red ? '红' : 
                          color === PlayerColor.Green ? '绿' : 
                          color === PlayerColor.Blue ? '蓝' : '黄';
    
    console.log(`${debugColorName}方大本营位置:`, headquartersPositions);
    console.log(`${debugColorName}方区域定义:`,
      color === PlayerColor.Red ? '行6-10, 列11-16 (大本营: [7,16], [9,16])' :
      color === PlayerColor.Green ? '行0-5, 列6-10 (大本营: [0,7], [0,9])' :
      color === PlayerColor.Blue ? '行6-10, 列0-5 (大本营: [7,0], [9,0])' :
      '行11-16, 列6-10 (大本营: [16,7], [16,9])'
    );
    
    flagPieces.forEach((piece: any, index: number) => {
      if (index < headquartersPositions.length) {
        const [row, col] = headquartersPositions[index];
        piece.position = { row, col };
        board[row][col] = piece;
        console.log(`${debugColorName}方军旗${index + 1}强制摆放在大本营: (${row}, ${col})`);
      } else {
        console.warn(`${debugColorName}方军旗数量超过可用大本营位置！`);
      }
    });

    // 2. 摆放地雷在最后两排（按照四国军棋规则，优先处理）
    const lastTwoRowsPositions = getLastTwoRowsPositions(color);
    let mineIndex = 0;
    
    minePieces.forEach((piece: any) => {
      if (mineIndex < lastTwoRowsPositions.length) {
        const [row, col] = lastTwoRowsPositions[mineIndex];
        piece.position = { row, col };
        board[row][col] = piece;
        mineIndex++;
        console.log(`${debugColorName}方地雷摆放在最后两排: (${row}, ${col})`);
      } else {
        console.warn(`${debugColorName}方地雷数量超过最后两排可用位置！`);
      }
    });

    // 3. 合并所有剩余位置（普通位置 + 未使用的最后两排位置）
    const remainingLastTwoRows = lastTwoRowsPositions.slice(mineIndex);
    const allAvailablePositions = [...sortedPositions, ...remainingLastTwoRows];
    
    console.log(`${debugColorName}方剩余可用位置: ${allAvailablePositions.length}个 (普通${sortedPositions.length}个 + 剩余最后两排${remainingLastTwoRows.length}个)`);

    // 4. 摆放普通棋子
    normalPieces.forEach((piece: any) => {
      if (positionIndex < allAvailablePositions.length) {
        const [row, col] = allAvailablePositions[positionIndex];
        piece.position = { row, col };
        board[row][col] = piece;
        positionIndex++;
      }
    });

    // 5. 摆放炸弹在剩余位置
    let bombsPlaced = 0;
    bombPieces.forEach((piece: any) => {
      if (positionIndex < allAvailablePositions.length) {
        const [row, col] = allAvailablePositions[positionIndex];
        piece.position = { row, col };
        board[row][col] = piece;
        positionIndex++;
        bombsPlaced++;
        console.log(`${debugColorName}方炸弹摆放在: (${row}, ${col})`);
      } else {
        console.warn(`${debugColorName}方炸弹摆放失败，可用位置不足！`);
      }
    });

    const colorName = color === PlayerColor.Red ? '红' : 
                     color === PlayerColor.Green ? '绿' : 
                     color === PlayerColor.Blue ? '蓝' : '黄';
    
    const totalPieces = normalPieces.length + minePieces.length + bombPieces.length + flagPieces.length;
    const placedPieces = normalPieces.length + minePieces.length + bombsPlaced + flagPieces.length;
    
    console.log(`${colorName}方棋子摆放完成：普通${normalPieces.length}枚，地雷${minePieces.length}枚，炸弹${bombsPlaced}/${bombPieces.length}枚，军旗${flagPieces.length}枚`);
    console.log(`${colorName}方总计：${placedPieces}/${totalPieces}枚棋子已摆放`);
    
    if (placedPieces < totalPieces) {
      console.error(`${colorName}方有${totalPieces - placedPieces}枚棋子未成功摆放！`);
      console.log(`${colorName}方可用位置总数: ${allAvailablePositions.length + headquartersPositions.length}`);
    }
  }

  updateData(boardData: BoardData): void {
    this.boardData = boardData;
    this.markDirty();
  }

  updateConfig(config: BoardConfig): void {
    this._config = config;
    this.markDirty();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || !this._config.visibility.showPieces) return;

    this.drawPieces(ctx);
    this._isDirty = false;
  }

  /**
   * 绘制所有棋子
   */
  private drawPieces(ctx: CanvasRenderingContext2D): void {
    const canvas = ctx.canvas;
    const { scale, scaledOffsetX, scaledOffsetY } = BoardLayer.calculateScaleAndOffset(canvas, this.boardData);
    const gameState = this.gameEngine.getGameState();

    // 遍历棋盘上的所有棋子
    for (let row = 0; row < 17; row++) {
      for (let col = 0; col < 17; col++) {
        const piece = gameState.board[row][col];
        if (piece && piece.position) {
          this.drawPiece(ctx, piece, row, col, scale, scaledOffsetX, scaledOffsetY);
        }
      }
    }
  }

  /**
   * 绘制单个棋子（矩形，与单元格大小一致）
   */
  private drawPiece(
    ctx: CanvasRenderingContext2D,
    piece: GamePiece,
    row: number,
    col: number,
    scale: number,
    scaledOffsetX: number,
    scaledOffsetY: number
  ): void {
    const cellSize = this.boardData.dimensions.cellSize * scale;
    const gap = this.boardData.dimensions.gap * scale;
    
    const x = scaledOffsetX + col * (cellSize + gap);
    const y = scaledOffsetY + row * (cellSize + gap);
    
    // 棋子矩形与单元格一致，留出小边距
    const margin = 2 * scale;
    const pieceX = x + margin;
    const pieceY = y + margin;
    const pieceSize = cellSize - margin * 2;

    // 获取棋子颜色
    const pieceColor = this.getPieceColor(piece.player);
    
    ctx.save();

    // 绘制棋子矩形背景
    ctx.fillStyle = pieceColor;
    ctx.fillRect(pieceX, pieceY, pieceSize, pieceSize);
    
    // 绘制棋子边框
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1.5 * scale;
    ctx.strokeRect(pieceX, pieceY, pieceSize, pieceSize);

    // 绘制棋子文字（居中在矩形中）
    const centerX = pieceX + pieceSize / 2;
    const centerY = pieceY + pieceSize / 2;
    this.drawPieceText(ctx, piece, centerX, centerY, pieceSize / 2, scale);

    ctx.restore();
  }

  /**
   * 绘制棋子文字（适配矩形棋子）- 优化清晰度
   */
  private drawPieceText(
    ctx: CanvasRenderingContext2D,
    piece: GamePiece,
    centerX: number,
    centerY: number,
    maxSize: number,
    _scale: number
  ): void {
    const pieceName = PIECE_NAMES[piece.type];

    // 根据矩形大小调整字体，确保清晰度
    const nameFont = Math.max(10, Math.round(maxSize * 0.45));

    // 清除任何现有的阴影效果
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 设置文字渲染属性以提高清晰度
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${nameFont}px "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif`;

    // 为了提高对比度，先绘制描边（如果需要）
    if (piece.player === PlayerColor.Yellow) {
      // 黄色背景用黑色文字，不需要描边
      ctx.fillStyle = '#000000';
    } else {
      // 其他颜色背景用白色文字，添加细微描边提高可读性
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.5;
      ctx.strokeText(pieceName.length <= 2 ? pieceName : pieceName.substring(0, 2), centerX, centerY);
      ctx.fillStyle = '#ffffff';
    }

    // 绘制棋子名称（居中）
    if (pieceName.length <= 2) {
      ctx.fillText(pieceName, centerX, centerY);
    } else {
      // 如果名称太长，只显示前两个字符
      ctx.fillText(pieceName.substring(0, 2), centerX, centerY);
    }
  }

  /**
   * 获取棋子背景颜色
   */
  private getPieceColor(player: PlayerColor): string {
    const colorMap = {
      [PlayerColor.Red]: '#E53935',    // 红色
      [PlayerColor.Green]: '#43A047',  // 绿色
      [PlayerColor.Blue]: '#1E88E5',   // 蓝色
      [PlayerColor.Yellow]: '#FDD835'  // 黄色
    };
    return colorMap[player];
  }


  /**
   * 获取游戏引擎实例
   */
  getGameEngine(): GameEngine {
    return this.gameEngine;
  }

  // ICanvasLayer接口实现
  isDirty(): boolean {
    return this._isDirty;
  }

  markDirty(_rect?: Rectangle): void {
    this._isDirty = true;
  }

  clearDirty(): void {
    this._isDirty = false;
  }

  getBounds(): Rectangle {
    return { x: 0, y: 0, width: 600, height: 600 };
  }

  hitTest(_point: Point): Drawable | null {
    // 棋子点击检测可以在这里实现
    return null;
  }

  dispose(): void {
    this.gameEngine.destroy();
  }
}