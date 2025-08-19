/**
 * 游戏引擎核心类
 * 管理游戏状态、回合流转、胜负判断等
 */

import {
  GamePiece,
  PlayerColor,
  Position,
  PieceStatus,
  PieceType,
  createPiece,
  STANDARD_PIECE_CONFIG
} from '../pieces/PieceTypes';
import { GameRules, BattleDetails } from './GameRules';
import { MoveValidator } from './MoveValidator';

// 游戏阶段枚举
export enum GamePhase {
  Setup = 'setup',           // 布局阶段
  Playing = 'playing',       // 游戏进行中
  Finished = 'finished'      // 游戏结束
}

// 回合信息
export interface TurnInfo {
  currentPlayer: PlayerColor;
  turnNumber: number;
  timeRemaining: number;     // 剩余时间（秒）
}

// 移动记录
export interface MoveRecord {
  id: string;
  player: PlayerColor;
  piece: GamePiece;
  from: Position;
  to: Position;
  battleDetails?: BattleDetails;
  timestamp: number;
  turnNumber: number;
}

// 玩家信息
export interface Player {
  color: PlayerColor;
  name: string;
  isAI: boolean;
  isAlive: boolean;
  pieces: GamePiece[];
  defeatedAt?: number;       // 败北回合数
}

// 游戏状态
export interface GameState {
  gameId: string;
  phase: GamePhase;
  board: (GamePiece | null)[][];
  players: Map<PlayerColor, Player>;
  turnInfo: TurnInfo;
  moveHistory: MoveRecord[];
  winningAlliance: PlayerColor[] | null;
  createdAt: number;
  lastUpdated: number;
}

/**
 * 游戏引擎类
 * 负责管理整个游戏的生命周期
 */
export class GameEngine {
  private gameState: GameState;
  private turnTimer: NodeJS.Timeout | null = null;
  private readonly TURN_TIME_LIMIT = 30; // 30秒每回合

  constructor(gameId?: string) {
    this.gameState = this.initializeGame(gameId || this.generateGameId());
  }

  /**
   * 初始化游戏
   */
  private initializeGame(gameId: string): GameState {
    const board: (GamePiece | null)[][] = Array(17).fill(null).map(() => 
      Array(17).fill(null)
    );

    const players = new Map<PlayerColor, Player>();
    
    // 初始化四个玩家
    const playerColors = [PlayerColor.Red, PlayerColor.Green, PlayerColor.Blue, PlayerColor.Yellow];
    
    playerColors.forEach(color => {
      players.set(color, {
        color,
        name: `${color}玩家`,
        isAI: color !== PlayerColor.Red, // 红色为人类玩家，其他为AI
        isAlive: true,
        pieces: []
      });
    });

    return {
      gameId,
      phase: GamePhase.Setup,
      board,
      players,
      turnInfo: {
        currentPlayer: PlayerColor.Red,
        turnNumber: 1,
        timeRemaining: this.TURN_TIME_LIMIT
      },
      moveHistory: [],
      winningAlliance: null,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };
  }

  /**
   * 生成游戏ID
   */
  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 为所有玩家创建初始棋子
   */
  initializePieces(): void {
    this.gameState.players.forEach((player, color) => {
      player.pieces = this.createPlayerPieces(color);
    });
    
    this.gameState.lastUpdated = Date.now();
  }

  /**
   * 为单个玩家创建棋子
   */
  private createPlayerPieces(playerColor: PlayerColor): GamePiece[] {
    const pieces: GamePiece[] = [];

    // 根据标准配置创建棋子
    Object.entries(STANDARD_PIECE_CONFIG).forEach(([type, count]) => {
      for (let i = 0; i < count; i++) {
        const piece = createPiece(
          type as PieceType,
          playerColor,
          { row: 0, col: 0 }, // 初始位置待定
          `${playerColor}_${type}_${i}`
        );
        pieces.push(piece);
      }
    });

    return pieces;
  }

  /**
   * 自动布置棋子到棋盘（简化版）
   */
  autoDeployPieces(): void {
    // 各玩家的部署区域
    const deploymentAreas = {
      [PlayerColor.Red]: { rows: [12, 13, 14, 15, 16], cols: [6, 7, 8, 9, 10] },
      [PlayerColor.Green]: { rows: [0, 1, 2, 3, 4], cols: [6, 7, 8, 9, 10] },
      [PlayerColor.Blue]: { rows: [6, 7, 8, 9, 10], cols: [0, 1, 2, 3, 4] },
      [PlayerColor.Yellow]: { rows: [6, 7, 8, 9, 10], cols: [12, 13, 14, 15, 16] }
    };

    this.gameState.players.forEach((player, color) => {
      const area = deploymentAreas[color];
      let positionIndex = 0;

      // 随机打乱棋子顺序
      const shuffledPieces = [...player.pieces].sort(() => Math.random() - 0.5);

      shuffledPieces.forEach(piece => {
        if (positionIndex < area.rows.length * area.cols.length) {
          const row = area.rows[Math.floor(positionIndex / area.cols.length)];
          const col = area.cols[positionIndex % area.cols.length];
          
          piece.position = { row, col };
          this.gameState.board[row][col] = piece;
          positionIndex++;
        }
      });
    });

    this.gameState.phase = GamePhase.Playing;
    this.gameState.lastUpdated = Date.now();
  }

  /**
   * 执行移动
   */
  makeMove(from: Position, to: Position): MoveRecord | null {
    const piece = this.gameState.board[from.row][from.col];
    
    if (!piece) {
      throw new Error('起始位置没有棋子');
    }

    if (piece.player !== this.gameState.turnInfo.currentPlayer) {
      throw new Error('不是当前玩家的回合');
    }

    // 验证移动
    const moveResult = MoveValidator.validateMove(piece, from, to, this.gameState.board);
    if (!moveResult.isValid) {
      throw new Error(moveResult.reason || '无效移动');
    }

    // 执行移动
    const moveRecord = this.executeMoveOnBoard(piece, from, to);
    
    // 检查游戏是否结束
    this.checkGameEnd();
    
    // 切换到下一个玩家
    if (this.gameState.phase === GamePhase.Playing) {
      this.nextTurn();
    }

    return moveRecord;
  }

  /**
   * 在棋盘上执行移动
   */
  private executeMoveOnBoard(piece: GamePiece, from: Position, to: Position): MoveRecord {
    const targetPiece = this.gameState.board[to.row][to.col];
    let battleDetails: BattleDetails | undefined;

    // 处理战斗
    if (targetPiece) {
      battleDetails = GameRules.resolveBattle(piece, targetPiece);
      
      // 处理战斗结果
      battleDetails.eliminated.forEach(eliminatedPiece => {
        eliminatedPiece.status = PieceStatus.Eliminated;
        eliminatedPiece.position = null;
      });

      // 移除被消灭的棋子
      if (battleDetails.eliminated.includes(piece)) {
        this.gameState.board[from.row][from.col] = null;
        piece.position = null;
      }
      
      if (battleDetails.eliminated.includes(targetPiece)) {
        this.gameState.board[to.row][to.col] = null;
        targetPiece.position = null;
      }
    }

    // 移动存活的棋子
    if (piece.status === PieceStatus.Active) {
      this.gameState.board[from.row][from.col] = null;
      this.gameState.board[to.row][to.col] = piece;
      piece.position = to;
    }

    // 创建移动记录
    const moveRecord: MoveRecord = {
      id: `move_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      player: piece.player,
      piece: { ...piece },
      from,
      to,
      battleDetails,
      timestamp: Date.now(),
      turnNumber: this.gameState.turnInfo.turnNumber
    };

    this.gameState.moveHistory.push(moveRecord);
    this.gameState.lastUpdated = Date.now();

    return moveRecord;
  }

  /**
   * 检查游戏是否结束
   */
  private checkGameEnd(): void {
    const allPlayerPieces = new Map<PlayerColor, GamePiece[]>();
    
    this.gameState.players.forEach((player, color) => {
      allPlayerPieces.set(color, player.pieces.filter(p => p.status === PieceStatus.Active));
    });

    // 检查个人败北状态
    this.gameState.players.forEach((player, color) => {
      if (player.isAlive && GameRules.isPlayerDefeated(player.pieces)) {
        player.isAlive = false;
        player.defeatedAt = this.gameState.turnInfo.turnNumber;
        console.log(`${color}玩家败北`);
      }
    });

    // 检查联盟胜利
    const winningAlliance = GameRules.checkAllianceVictory(allPlayerPieces);
    if (winningAlliance) {
      this.gameState.winningAlliance = winningAlliance;
      this.gameState.phase = GamePhase.Finished;
      this.stopTurnTimer();
      console.log(`游戏结束！获胜联盟: ${winningAlliance.join(', ')}`);
    }
  }

  /**
   * 切换到下一个玩家回合
   */
  private nextTurn(): void {
    const playerOrder = [PlayerColor.Red, PlayerColor.Green, PlayerColor.Blue, PlayerColor.Yellow];
    let currentIndex = playerOrder.indexOf(this.gameState.turnInfo.currentPlayer);
    
    // 找到下一个存活的玩家
    do {
      currentIndex = (currentIndex + 1) % 4;
      const nextPlayer = playerOrder[currentIndex];
      const player = this.gameState.players.get(nextPlayer);
      
      if (player && player.isAlive) {
        this.gameState.turnInfo.currentPlayer = nextPlayer;
        break;
      }
    } while (currentIndex !== playerOrder.indexOf(this.gameState.turnInfo.currentPlayer));

    // 增加回合数（完整轮次）
    if (this.gameState.turnInfo.currentPlayer === PlayerColor.Red) {
      this.gameState.turnInfo.turnNumber++;
    }

    this.gameState.turnInfo.timeRemaining = this.TURN_TIME_LIMIT;
    this.startTurnTimer();
  }

  /**
   * 开始回合计时
   */
  private startTurnTimer(): void {
    this.stopTurnTimer();
    
    this.turnTimer = setInterval(() => {
      this.gameState.turnInfo.timeRemaining--;
      
      if (this.gameState.turnInfo.timeRemaining <= 0) {
        console.log(`${this.gameState.turnInfo.currentPlayer}超时，跳过回合`);
        this.nextTurn();
      }
    }, 1000);
  }

  /**
   * 停止回合计时
   */
  private stopTurnTimer(): void {
    if (this.turnTimer) {
      clearInterval(this.turnTimer);
      this.turnTimer = null;
    }
  }

  /**
   * 获取当前游戏状态
   */
  getGameState(): GameState {
    return { ...this.gameState };
  }

  /**
   * 获取特定玩家的棋子
   */
  getPlayerPieces(player: PlayerColor): GamePiece[] {
    const playerData = this.gameState.players.get(player);
    return playerData ? [...playerData.pieces] : [];
  }

  /**
   * 获取棋盘上特定位置的棋子
   */
  getPieceAtPosition(position: Position): GamePiece | null {
    if (!GameRules.isValidPosition(position, 17, 17)) {
      return null;
    }
    return this.gameState.board[position.row][position.col];
  }

  /**
   * 获取当前玩家的所有可移动棋子
   */
  getCurrentPlayerMovablePieces(): GamePiece[] {
    const currentPlayer = this.gameState.players.get(this.gameState.turnInfo.currentPlayer);
    if (!currentPlayer) return [];

    return currentPlayer.pieces.filter(piece => 
      piece.status === PieceStatus.Active && 
      piece.position !== null &&
      GameRules.getPossibleMoves(piece, this.gameState.board).length > 0
    );
  }

  /**
   * 销毁游戏（清理资源）
   */
  destroy(): void {
    this.stopTurnTimer();
    this.gameState.phase = GamePhase.Finished;
  }
}