/**
 * 游戏状态管理
 * 提供状态序列化、持久化和恢复功能
 */

import { GamePiece, PlayerColor, PieceStatus } from '../pieces/PieceTypes';
import { GameState, Player, MoveRecord, GamePhase, TurnInfo } from './GameEngine';

// 序列化的游戏状态
export interface SerializedGameState {
  gameId: string;
  phase: GamePhase;
  boardState: (string | null)[][];  // 使用棋子ID而不是完整对象
  players: SerializedPlayer[];
  turnInfo: TurnInfo;
  moveHistory: MoveRecord[];
  winningAlliance: PlayerColor[] | null;
  createdAt: number;
  lastUpdated: number;
}

// 序列化的玩家信息
export interface SerializedPlayer {
  color: PlayerColor;
  name: string;
  isAI: boolean;
  isAlive: boolean;
  pieces: GamePiece[];
  defeatedAt?: number;
}

// 游戏快照（用于撤销/重做）
export interface GameSnapshot {
  state: SerializedGameState;
  timestamp: number;
  description: string;
}

/**
 * 游戏状态管理器
 */
export class GameStateManager {
  private snapshots: GameSnapshot[] = [];
  private maxSnapshots = 10;
  private currentSnapshotIndex = -1;

  /**
   * 序列化游戏状态
   */
  static serializeGameState(gameState: GameState): SerializedGameState {
    // 创建棋子ID到棋子的映射
    const pieceMap = new Map<string, GamePiece>();
    gameState.players.forEach(player => {
      player.pieces.forEach(piece => {
        pieceMap.set(piece.id, piece);
      });
    });

    // 序列化棋盘（只保存棋子ID）
    const boardState: (string | null)[][] = gameState.board.map(row =>
      row.map(cell => cell ? cell.id : null)
    );

    // 序列化玩家信息
    const players: SerializedPlayer[] = [];
    gameState.players.forEach(player => {
      players.push({
        color: player.color,
        name: player.name,
        isAI: player.isAI,
        isAlive: player.isAlive,
        pieces: [...player.pieces],
        defeatedAt: player.defeatedAt
      });
    });

    return {
      gameId: gameState.gameId,
      phase: gameState.phase,
      boardState,
      players,
      turnInfo: { ...gameState.turnInfo },
      moveHistory: [...gameState.moveHistory],
      winningAlliance: gameState.winningAlliance ? [...gameState.winningAlliance] : null,
      createdAt: gameState.createdAt,
      lastUpdated: gameState.lastUpdated
    };
  }

  /**
   * 反序列化游戏状态
   */
  static deserializeGameState(serialized: SerializedGameState): GameState {
    // 创建棋子ID到棋子的映射
    const pieceMap = new Map<string, GamePiece>();
    serialized.players.forEach(player => {
      player.pieces.forEach(piece => {
        pieceMap.set(piece.id, piece);
      });
    });

    // 重建棋盘
    const board: (GamePiece | null)[][] = serialized.boardState.map(row =>
      row.map(cellId => cellId ? pieceMap.get(cellId) || null : null)
    );

    // 重建玩家信息
    const players = new Map<PlayerColor, Player>();
    serialized.players.forEach(serializedPlayer => {
      players.set(serializedPlayer.color, {
        color: serializedPlayer.color,
        name: serializedPlayer.name,
        isAI: serializedPlayer.isAI,
        isAlive: serializedPlayer.isAlive,
        pieces: [...serializedPlayer.pieces],
        defeatedAt: serializedPlayer.defeatedAt
      });
    });

    return {
      gameId: serialized.gameId,
      phase: serialized.phase,
      board,
      players,
      turnInfo: { ...serialized.turnInfo },
      moveHistory: [...serialized.moveHistory],
      winningAlliance: serialized.winningAlliance ? [...serialized.winningAlliance] : null,
      createdAt: serialized.createdAt,
      lastUpdated: serialized.lastUpdated
    };
  }

  /**
   * 创建游戏快照
   */
  createSnapshot(gameState: GameState, description: string = ''): void {
    const snapshot: GameSnapshot = {
      state: GameStateManager.serializeGameState(gameState),
      timestamp: Date.now(),
      description: description || `Turn ${gameState.turnInfo.turnNumber}`
    };

    // 如果当前不在最新快照位置，删除后续快照
    if (this.currentSnapshotIndex < this.snapshots.length - 1) {
      this.snapshots.splice(this.currentSnapshotIndex + 1);
    }

    // 添加新快照
    this.snapshots.push(snapshot);
    this.currentSnapshotIndex = this.snapshots.length - 1;

    // 限制快照数量
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
      this.currentSnapshotIndex--;
    }
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this.currentSnapshotIndex > 0;
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this.currentSnapshotIndex < this.snapshots.length - 1;
  }

  /**
   * 撤销到上一个快照
   */
  undo(): GameState | null {
    if (!this.canUndo()) {
      return null;
    }

    this.currentSnapshotIndex--;
    const snapshot = this.snapshots[this.currentSnapshotIndex];
    return GameStateManager.deserializeGameState(snapshot.state);
  }

  /**
   * 重做到下一个快照
   */
  redo(): GameState | null {
    if (!this.canRedo()) {
      return null;
    }

    this.currentSnapshotIndex++;
    const snapshot = this.snapshots[this.currentSnapshotIndex];
    return GameStateManager.deserializeGameState(snapshot.state);
  }

  /**
   * 获取当前快照
   */
  getCurrentSnapshot(): GameSnapshot | null {
    if (this.currentSnapshotIndex >= 0 && this.currentSnapshotIndex < this.snapshots.length) {
      return this.snapshots[this.currentSnapshotIndex];
    }
    return null;
  }

  /**
   * 获取所有快照信息（用于UI显示）
   */
  getSnapshotInfo(): Array<{index: number, timestamp: number, description: string, isCurrent: boolean}> {
    return this.snapshots.map((snapshot, index) => ({
      index,
      timestamp: snapshot.timestamp,
      description: snapshot.description,
      isCurrent: index === this.currentSnapshotIndex
    }));
  }

  /**
   * 清空快照历史
   */
  clearSnapshots(): void {
    this.snapshots = [];
    this.currentSnapshotIndex = -1;
  }
}

/**
 * 游戏状态验证器
 */
export class GameStateValidator {
  
  /**
   * 验证游戏状态的完整性
   */
  static validateGameState(gameState: GameState): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证基本字段
    if (!gameState.gameId) {
      errors.push('缺少游戏ID');
    }

    if (!Object.values(GamePhase).includes(gameState.phase)) {
      errors.push('无效的游戏阶段');
    }

    // 验证棋盘尺寸
    if (!gameState.board || gameState.board.length !== 17) {
      errors.push('棋盘行数不正确');
    } else if (gameState.board.some(row => !row || row.length !== 17)) {
      errors.push('棋盘列数不正确');
    }

    // 验证玩家数量
    if (gameState.players.size !== 4) {
      errors.push(`玩家数量不正确: ${gameState.players.size}, 应为4`);
    }

    // 验证每个玩家
    const requiredColors = [PlayerColor.Red, PlayerColor.Green, PlayerColor.Blue, PlayerColor.Yellow];
    requiredColors.forEach(color => {
      const player = gameState.players.get(color);
      if (!player) {
        errors.push(`缺少${color}玩家`);
      } else {
        const pieceValidation = this.validatePlayerPieces(player);
        if (!pieceValidation.isValid) {
          errors.push(...pieceValidation.errors.map(e => `${color}玩家: ${e}`));
        }
      }
    });

    // 验证棋盘与棋子位置的一致性
    const boardValidation = this.validateBoardConsistency(gameState);
    if (!boardValidation.isValid) {
      errors.push(...boardValidation.errors);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * 验证玩家棋子
   */
  private static validatePlayerPieces(player: Player): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查棋子数量
    if (player.pieces.length !== 25) {
      errors.push(`棋子数量不正确: ${player.pieces.length}, 应为25`);
    }

    // 检查棋子唯一性
    const pieceIds = player.pieces.map(p => p.id);
    const uniqueIds = new Set(pieceIds);
    if (uniqueIds.size !== pieceIds.length) {
      errors.push('存在重复的棋子ID');
    }

    // 检查棋子归属
    player.pieces.forEach((piece, index) => {
      if (piece.player !== player.color) {
        errors.push(`棋子${index}归属错误`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * 验证棋盘一致性
   */
  private static validateBoardConsistency(gameState: GameState): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const boardPieces = new Set<string>();

    // 收集棋盘上的所有棋子
    for (let row = 0; row < gameState.board.length; row++) {
      for (let col = 0; col < gameState.board[row].length; col++) {
        const piece = gameState.board[row][col];
        if (piece) {
          // 检查位置一致性
          if (!piece.position || piece.position.row !== row || piece.position.col !== col) {
            errors.push(`棋子${piece.id}的位置信息不一致`);
          }

          // 检查重复
          if (boardPieces.has(piece.id)) {
            errors.push(`棋子${piece.id}在棋盘上重复出现`);
          }
          boardPieces.add(piece.id);
        }
      }
    }

    // 检查玩家棋子与棋盘一致性
    gameState.players.forEach(player => {
      player.pieces.forEach(piece => {
        if (piece.status === PieceStatus.Active && piece.position) {
          const boardPiece = gameState.board[piece.position.row][piece.position.col];
          if (boardPiece?.id !== piece.id) {
            errors.push(`棋子${piece.id}不在预期位置`);
          }
        }
      });
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * 修复常见的状态不一致问题
   */
  static repairGameState(gameState: GameState): { repaired: GameState; changes: string[] } {
    const changes: string[] = [];
    const repairedState = JSON.parse(JSON.stringify(gameState)); // 深拷贝

    // TODO: 实现状态修复逻辑
    // 这里可以添加自动修复逻辑，比如：
    // - 重新同步棋子位置
    // - 修复玩家状态
    // - 清理无效的移动记录等

    return { repaired: repairedState, changes };
  }
}