/**
 * 四国军棋游戏规则引擎
 * 实现棋子对战、移动规则、胜负判断等核心逻辑
 */

import {
  GamePiece,
  PieceType,
  PlayerColor,
  Position,
  PieceStatus,
  canPieceMove,
  hasRailwayBonus
} from '../pieces/PieceTypes';

// 战斗结果枚举
export enum BattleResult {
  AttackerWins = 'attacker_wins',       // 攻击方获胜
  DefenderWins = 'defender_wins',       // 防守方获胜
  BothEliminated = 'both_eliminated',   // 同归于尽
  EngineerDefuseMine = 'engineer_defuse_mine'  // 工兵挖雷
}

// 移动结果接口
export interface MoveResult {
  isValid: boolean;
  reason?: string;
  battleResult?: BattleResult;
  eliminatedPieces?: GamePiece[];
}

// 战斗结果详情
export interface BattleDetails {
  attacker: GamePiece;
  defender: GamePiece;
  result: BattleResult;
  winner?: GamePiece;
  eliminated: GamePiece[];
}

// 联盟关系枚举
export enum AllianceType {
  Ally = 'ally',      // 盟友
  Enemy = 'enemy'     // 敌人
}

/**
 * 游戏规则引擎类
 */
export class GameRules {
  
  /**
   * 检查两个玩家的联盟关系
   * 红蓝联盟 vs 黄绿联盟（对角线为盟友）
   */
  static getAllianceType(player1: PlayerColor, player2: PlayerColor): AllianceType {
    const redBlueAlliance = [PlayerColor.Red, PlayerColor.Blue];
    const yellowGreenAlliance = [PlayerColor.Yellow, PlayerColor.Green];
    
    if (
      (redBlueAlliance.includes(player1) && redBlueAlliance.includes(player2)) ||
      (yellowGreenAlliance.includes(player1) && yellowGreenAlliance.includes(player2))
    ) {
      return AllianceType.Ally;
    }
    
    return AllianceType.Enemy;
  }

  /**
   * 棋子对战逻辑
   * 根据棋子等级和特殊规则判断战斗结果
   */
  static resolveBattle(attacker: GamePiece, defender: GamePiece): BattleDetails {
    // 盟友不能相互攻击
    if (this.getAllianceType(attacker.player, defender.player) === AllianceType.Ally) {
      throw new Error('盟友棋子不能相互攻击');
    }

    const result: BattleDetails = {
      attacker,
      defender,
      result: BattleResult.BothEliminated,
      eliminated: []
    };

    // 特殊规则处理

    // 1. 工兵挖雷规则
    if (attacker.type === PieceType.Engineer && defender.type === PieceType.Mine) {
      result.result = BattleResult.EngineerDefuseMine;
      result.winner = attacker;
      result.eliminated = [defender];
      return result;
    }

    // 2. 炸弹规则：炸弹与任何棋子同归于尽（包括司令）
    if (defender.type === PieceType.Bomb) {
      result.result = BattleResult.BothEliminated;
      result.eliminated = [attacker, defender];
      return result;
    }

    // 3. 地雷规则：除工兵外，其他棋子碰到地雷同归于尽
    if (defender.type === PieceType.Mine && attacker.type !== PieceType.Engineer) {
      result.result = BattleResult.BothEliminated;
      result.eliminated = [attacker, defender];
      return result;
    }

    // 4. 军旗规则：军旗被任何棋子夺取（不参与战斗）
    if (defender.type === PieceType.Flag) {
      result.result = BattleResult.AttackerWins;
      result.winner = attacker;
      result.eliminated = []; // 军旗被夺取但不算被消灭
      return result;
    }

    // 5. 普通对战：按等级比较
    if (attacker.rank > defender.rank) {
      // 攻击方等级更高
      result.result = BattleResult.AttackerWins;
      result.winner = attacker;
      result.eliminated = [defender];
    } else if (attacker.rank < defender.rank) {
      // 防守方等级更高
      result.result = BattleResult.DefenderWins;
      result.winner = defender;
      result.eliminated = [attacker];
    } else {
      // 等级相同，同归于尽
      result.result = BattleResult.BothEliminated;
      result.eliminated = [attacker, defender];
    }

    return result;
  }

  /**
   * 检查基本移动规则
   * 检查棋子是否可以从起始位置移动到目标位置
   */
  static canMovePiece(
    piece: GamePiece, 
    fromPos: Position, 
    toPos: Position,
    board: (GamePiece | null)[][]
  ): MoveResult {
    // 1. 基础检查：棋子是否可以移动
    if (!canPieceMove(piece)) {
      return {
        isValid: false,
        reason: `${piece.type}不能移动`
      };
    }

    // 2. 位置有效性检查
    if (!this.isValidPosition(toPos, board.length, board[0].length)) {
      return {
        isValid: false,
        reason: '目标位置超出棋盘范围'
      };
    }

    // 3. 检查目标位置
    const targetPiece = board[toPos.row][toPos.col];
    if (targetPiece) {
      // 目标位置有棋子
      if (this.getAllianceType(piece.player, targetPiece.player) === AllianceType.Ally) {
        return {
          isValid: false,
          reason: '不能移动到盟友棋子位置'
        };
      }
      // 可以攻击敌方棋子
    }

    // 4. 移动距离和路径检查
    const distance = this.calculateDistance(fromPos, toPos);
    
    // 普通棋子只能移动一步
    if (!hasRailwayBonus(piece) && distance > 1) {
      return {
        isValid: false,
        reason: '普通棋子只能移动一步'
      };
    }

    // 5. 方向检查：只能上下左右移动，不能斜向
    if (!this.isOrthogonalMove(fromPos, toPos)) {
      return {
        isValid: false,
        reason: '只能上下左右移动，不能斜向移动'
      };
    }

    // 6. 工兵铁路移动特殊处理
    if (hasRailwayBonus(piece) && distance > 1) {
      // TODO: 检查是否在铁路线上且路径畅通
      // 这里需要结合棋盘的铁路信息，暂时简化处理
      if (!this.isPathClear(fromPos, toPos, board)) {
        return {
          isValid: false,
          reason: '移动路径被阻挡'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * 检查位置是否在棋盘范围内
   */
  static isValidPosition(pos: Position, rows: number, cols: number): boolean {
    return pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols;
  }

  /**
   * 计算两个位置之间的曼哈顿距离
   */
  static calculateDistance(from: Position, to: Position): number {
    return Math.abs(from.row - to.row) + Math.abs(from.col - to.col);
  }

  /**
   * 检查是否为正交移动（上下左右）
   */
  static isOrthogonalMove(from: Position, to: Position): boolean {
    const rowDiff = Math.abs(from.row - to.row);
    const colDiff = Math.abs(from.col - to.col);
    
    // 要么在同一行，要么在同一列
    return (rowDiff === 0 && colDiff > 0) || (rowDiff > 0 && colDiff === 0);
  }

  /**
   * 检查路径是否畅通（用于工兵远距离移动）
   */
  static isPathClear(
    from: Position, 
    to: Position, 
    board: (GamePiece | null)[][]
  ): boolean {
    const rowStep = to.row > from.row ? 1 : to.row < from.row ? -1 : 0;
    const colStep = to.col > from.col ? 1 : to.col < from.col ? -1 : 0;
    
    let currentRow = from.row + rowStep;
    let currentCol = from.col + colStep;
    
    // 检查路径上的每个位置（不包括起点和终点）
    while (currentRow !== to.row || currentCol !== to.col) {
      if (board[currentRow][currentCol] !== null) {
        return false; // 路径被阻挡
      }
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  }

  /**
   * 检查玩家是否败北
   * 败北条件：1. 军旗被夺取 2. 所有可移动棋子被消灭
   */
  static isPlayerDefeated(playerPieces: GamePiece[]): boolean {
    const activePieces = playerPieces.filter(p => p.status === PieceStatus.Active);
    
    // 检查军旗是否还在
    const flag = activePieces.find(p => p.type === PieceType.Flag);
    if (!flag || flag.position === null) {
      return true; // 军旗被夺取
    }
    
    // 检查是否还有可移动的棋子
    const movablePieces = activePieces.filter(p => canPieceMove(p));
    return movablePieces.length === 0;
  }

  /**
   * 检查联盟是否获胜
   * 胜利条件：对方联盟的两名玩家都败北
   */
  static checkAllianceVictory(allPlayerPieces: Map<PlayerColor, GamePiece[]>): PlayerColor[] | null {
    const redBlueAlliance = [PlayerColor.Red, PlayerColor.Blue];
    const yellowGreenAlliance = [PlayerColor.Yellow, PlayerColor.Green];
    
    // 检查红蓝联盟是否败北
    const redBlueDefeated = redBlueAlliance.every(player => {
      const pieces = allPlayerPieces.get(player) || [];
      return this.isPlayerDefeated(pieces);
    });
    
    if (redBlueDefeated) {
      return yellowGreenAlliance; // 黄绿联盟获胜
    }
    
    // 检查黄绿联盟是否败北
    const yellowGreenDefeated = yellowGreenAlliance.every(player => {
      const pieces = allPlayerPieces.get(player) || [];
      return this.isPlayerDefeated(pieces);
    });
    
    if (yellowGreenDefeated) {
      return redBlueAlliance; // 红蓝联盟获胜
    }
    
    return null; // 游戏继续
  }

  /**
   * 获取棋子的可移动位置列表
   */
  static getPossibleMoves(
    piece: GamePiece,
    board: (GamePiece | null)[][],
    includeAttacks: boolean = true
  ): Position[] {
    if (!piece.position || !canPieceMove(piece)) {
      return [];
    }

    const possibleMoves: Position[] = [];
    const { row, col } = piece.position;
    
    // 四个方向：上、下、左、右
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ];

    for (const [rowDelta, colDelta] of directions) {
      // 普通棋子只能移动一步
      if (!hasRailwayBonus(piece)) {
        const newPos = { row: row + rowDelta, col: col + colDelta };
        const moveResult = this.canMovePiece(piece, piece.position, newPos, board);
        
        if (moveResult.isValid) {
          const targetPiece = board[newPos.row][newPos.col];
          
          // 如果目标位置有敌方棋子且允许攻击，则包含此位置
          if (!targetPiece || 
              (includeAttacks && targetPiece && 
               this.getAllianceType(piece.player, targetPiece.player) === AllianceType.Enemy)) {
            possibleMoves.push(newPos);
          }
        }
      } else {
        // 工兵在铁路上可以远距离移动
        // TODO: 根据实际铁路连接实现，这里简化为直线移动
        for (let distance = 1; distance <= Math.max(board.length, board[0].length); distance++) {
          const newPos = { 
            row: row + rowDelta * distance, 
            col: col + colDelta * distance 
          };
          
          if (!this.isValidPosition(newPos, board.length, board[0].length)) {
            break; // 超出边界
          }
          
          const moveResult = this.canMovePiece(piece, piece.position, newPos, board);
          if (!moveResult.isValid) {
            break; // 不能移动到此位置
          }
          
          const targetPiece = board[newPos.row][newPos.col];
          if (targetPiece) {
            // 遇到棋子
            if (includeAttacks && 
                this.getAllianceType(piece.player, targetPiece.player) === AllianceType.Enemy) {
              possibleMoves.push(newPos); // 可以攻击敌方棋子
            }
            break; // 无论如何都要停止
          } else {
            possibleMoves.push(newPos); // 空位置，可以移动
          }
        }
      }
    }

    return possibleMoves;
  }
}