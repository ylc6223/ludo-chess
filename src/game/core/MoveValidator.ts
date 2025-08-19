/**
 * 移动规则验证器
 * 提供详细的移动验证和路径计算功能
 */

import { GamePiece, Position, PlayerColor, PieceType } from '../pieces/PieceTypes';
import { GameRules, MoveResult } from './GameRules';

// 移动类型枚举
export enum MoveType {
  Normal = 'normal',       // 普通移动
  Attack = 'attack',       // 攻击移动
  Railway = 'railway'      // 铁路移动（工兵专用）
}

// 详细移动验证结果
export interface DetailedMoveResult extends MoveResult {
  moveType: MoveType;
  path: Position[];
  distance: number;
  targetPiece?: GamePiece;
}

// 路径节点类型
export interface PathNode {
  position: Position;
  gCost: number;    // 从起点到该节点的实际代价
  hCost: number;    // 从该节点到终点的启发式代价
  fCost: number;    // gCost + hCost
  parent: PathNode | null;
}

/**
 * 移动验证器类
 * 提供高级的移动验证和路径搜索功能
 */
export class MoveValidator {
  
  /**
   * 详细验证移动的合法性
   */
  static validateMove(
    piece: GamePiece,
    fromPos: Position,
    toPos: Position,
    board: (GamePiece | null)[][]
  ): DetailedMoveResult {
    // 基础移动验证
    const basicResult = GameRules.canMovePiece(piece, fromPos, toPos, board);
    
    if (!basicResult.isValid) {
      return {
        ...basicResult,
        moveType: MoveType.Normal,
        path: [],
        distance: 0
      };
    }

    const distance = GameRules.calculateDistance(fromPos, toPos);
    const targetPiece = board[toPos.row][toPos.col];
    
    // 确定移动类型
    let moveType = MoveType.Normal;
    if (targetPiece && GameRules.getAllianceType(piece.player, targetPiece.player) === 'enemy') {
      moveType = MoveType.Attack;
    } else if (piece.type === PieceType.Engineer && distance > 1) {
      moveType = MoveType.Railway;
    }

    // 计算移动路径
    const path = this.calculatePath(fromPos, toPos, board, piece);

    return {
      isValid: true,
      moveType,
      path,
      distance,
      targetPiece: targetPiece || undefined
    };
  }

  /**
   * 计算移动路径
   */
  static calculatePath(
    fromPos: Position,
    toPos: Position,
    board: (GamePiece | null)[][],
    piece: GamePiece
  ): Position[] {
    // 对于直线移动，计算简单路径
    if (GameRules.isOrthogonalMove(fromPos, toPos)) {
      return this.calculateStraightPath(fromPos, toPos);
    }
    
    // 对于复杂路径，使用A*算法
    return this.findPathAStar(fromPos, toPos, board, piece);
  }

  /**
   * 计算直线路径
   */
  static calculateStraightPath(fromPos: Position, toPos: Position): Position[] {
    const path: Position[] = [];
    
    const rowStep = toPos.row > fromPos.row ? 1 : toPos.row < fromPos.row ? -1 : 0;
    const colStep = toPos.col > fromPos.col ? 1 : toPos.col < fromPos.col ? -1 : 0;
    
    let currentRow = fromPos.row;
    let currentCol = fromPos.col;
    
    while (currentRow !== toPos.row || currentCol !== toPos.col) {
      path.push({ row: currentRow, col: currentCol });
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    path.push(toPos); // 添加终点
    
    return path;
  }

  /**
   * 使用A*算法寻找路径
   */
  static findPathAStar(
    fromPos: Position,
    toPos: Position,
    board: (GamePiece | null)[][],
    piece: GamePiece
  ): Position[] {
    const openSet: PathNode[] = [];
    const closedSet: Set<string> = new Set();
    
    const startNode: PathNode = {
      position: fromPos,
      gCost: 0,
      hCost: this.calculateHeuristic(fromPos, toPos),
      fCost: 0,
      parent: null
    };
    startNode.fCost = startNode.gCost + startNode.hCost;
    
    openSet.push(startNode);
    
    while (openSet.length > 0) {
      // 找到fCost最小的节点
      let currentNode = openSet[0];
      let currentIndex = 0;
      
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].fCost < currentNode.fCost) {
          currentNode = openSet[i];
          currentIndex = i;
        }
      }
      
      // 从开放集中移除当前节点
      openSet.splice(currentIndex, 1);
      closedSet.add(this.positionToString(currentNode.position));
      
      // 检查是否到达目标
      if (this.positionsEqual(currentNode.position, toPos)) {
        return this.reconstructPath(currentNode);
      }
      
      // 检查相邻节点
      const neighbors = this.getNeighbors(currentNode.position, board);
      
      for (const neighbor of neighbors) {
        const neighborKey = this.positionToString(neighbor);
        
        if (closedSet.has(neighborKey)) {
          continue; // 已经处理过
        }
        
        // 检查是否可以移动到这个位置
        const moveResult = GameRules.canMovePiece(piece, currentNode.position, neighbor, board);
        if (!moveResult.isValid) {
          continue;
        }
        
        const gCost = currentNode.gCost + 1;
        const hCost = this.calculateHeuristic(neighbor, toPos);
        
        let neighborNode = openSet.find(node => 
          this.positionsEqual(node.position, neighbor)
        );
        
        if (!neighborNode) {
          neighborNode = {
            position: neighbor,
            gCost,
            hCost,
            fCost: gCost + hCost,
            parent: currentNode
          };
          openSet.push(neighborNode);
        } else if (gCost < neighborNode.gCost) {
          neighborNode.gCost = gCost;
          neighborNode.fCost = gCost + hCost;
          neighborNode.parent = currentNode;
        }
      }
    }
    
    // 没有找到路径，返回直线路径
    return this.calculateStraightPath(fromPos, toPos);
  }

  /**
   * 计算启发式代价（曼哈顿距离）
   */
  static calculateHeuristic(from: Position, to: Position): number {
    return Math.abs(from.row - to.row) + Math.abs(from.col - to.col);
  }

  /**
   * 获取相邻位置
   */
  static getNeighbors(position: Position, board: (GamePiece | null)[][]): Position[] {
    const neighbors: Position[] = [];
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1]  // 上、下、左、右
    ];
    
    for (const [rowDelta, colDelta] of directions) {
      const newPos = {
        row: position.row + rowDelta,
        col: position.col + colDelta
      };
      
      if (GameRules.isValidPosition(newPos, board.length, board[0].length)) {
        neighbors.push(newPos);
      }
    }
    
    return neighbors;
  }

  /**
   * 重构路径
   */
  static reconstructPath(endNode: PathNode): Position[] {
    const path: Position[] = [];
    let currentNode: PathNode | null = endNode;
    
    while (currentNode !== null) {
      path.unshift(currentNode.position);
      currentNode = currentNode.parent;
    }
    
    return path;
  }

  /**
   * 位置转字符串（用于Set操作）
   */
  static positionToString(position: Position): string {
    return `${position.row},${position.col}`;
  }

  /**
   * 比较两个位置是否相等
   */
  static positionsEqual(pos1: Position, pos2: Position): boolean {
    return pos1.row === pos2.row && pos1.col === pos2.col;
  }

  /**
   * 获取棋子的所有合法移动
   */
  static getAllValidMoves(
    piece: GamePiece,
    board: (GamePiece | null)[][]
  ): DetailedMoveResult[] {
    if (!piece.position) {
      return [];
    }

    const validMoves: DetailedMoveResult[] = [];
    const possiblePositions = GameRules.getPossibleMoves(piece, board, true);
    
    for (const targetPos of possiblePositions) {
      const moveResult = this.validateMove(piece, piece.position, targetPos, board);
      if (moveResult.isValid) {
        validMoves.push(moveResult);
      }
    }
    
    return validMoves;
  }

  /**
   * 检查位置是否受到威胁
   */
  static isPositionThreatened(
    position: Position,
    byPlayer: PlayerColor,
    board: (GamePiece | null)[][]
  ): boolean {
    // 检查所有敌方棋子是否能攻击到这个位置
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        const piece = board[row][col];
        if (piece && piece.player === byPlayer) {
          const possibleMoves = GameRules.getPossibleMoves(piece, board, true);
          if (possibleMoves.some(move => 
            move.row === position.row && move.col === position.col)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * 计算移动的战术价值
   */
  static calculateMoveValue(
    moveResult: DetailedMoveResult,
    piece: GamePiece
  ): number {
    let value = 0;
    
    // 基础移动价值
    value += 1;
    
    // 攻击加分
    if (moveResult.moveType === MoveType.Attack && moveResult.targetPiece) {
      value += moveResult.targetPiece.rank * 0.1;
    }
    
    // 距离惩罚（鼓励短距离移动）
    value -= moveResult.distance * 0.1;
    
    // 棋子重要性加权
    value *= piece.rank * 0.01;
    
    return value;
  }
}