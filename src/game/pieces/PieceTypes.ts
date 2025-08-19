/**
 * 四国军棋棋子类型和等级定义
 * 根据游戏规则引擎设计文档实现
 */

// 棋子等级枚举（使用数值表示，司令40为最强，递减到排长31）
export enum PieceRank {
  Commander = 40,    // 司令
  General = 39,      // 军长
  Division = 38,     // 师长
  Brigade = 37,      // 旅长
  Regiment = 36,     // 团长
  Battalion = 35,    // 营长
  Company = 34,      // 连长
  Platoon = 33,      // 排长
  Engineer = 32,     // 工兵
  
  // 特殊棋子
  Bomb = -1,         // 炸弹
  Mine = -2,         // 地雷
  Flag = -3          // 军旗
}

// 棋子类型枚举
export enum PieceType {
  Commander = 'commander',
  General = 'general',
  Division = 'division',
  Brigade = 'brigade',
  Regiment = 'regiment',
  Battalion = 'battalion',
  Company = 'company',
  Platoon = 'platoon',
  Engineer = 'engineer',
  Bomb = 'bomb',
  Mine = 'mine',
  Flag = 'flag'
}

// 玩家颜色枚举
export enum PlayerColor {
  Red = 'red',
  Green = 'green',
  Blue = 'blue',
  Yellow = 'yellow'
}

// 棋子可见性状态
export enum PieceVisibility {
  Hidden = 'hidden',     // 暗棋（对手不可见）
  Visible = 'visible',   // 明棋（全部可见）
  Revealed = 'revealed'  // 已翻开（原本暗棋但已被翻开）
}

// 棋子状态
export enum PieceStatus {
  Active = 'active',        // 活跃状态
  Captured = 'captured',    // 被吃掉
  Eliminated = 'eliminated' // 同归于尽
}

// 单个棋子数据接口
export interface GamePiece {
  id: string;                    // 棋子唯一标识
  type: PieceType;               // 棋子类型
  rank: PieceRank;               // 棋子等级
  player: PlayerColor;           // 所属玩家
  position: Position | null;     // 当前位置（null表示被吃掉）
  visibility: PieceVisibility;   // 可见性状态
  status: PieceStatus;           // 棋子状态
  canMove: boolean;              // 是否可以移动
}

// 棋盘位置接口
export interface Position {
  row: number;
  col: number;
}

// 棋子配置（每种棋子的数量）
export interface PieceConfig {
  [PieceType.Commander]: number;  // 1
  [PieceType.General]: number;    // 1
  [PieceType.Division]: number;   // 2
  [PieceType.Brigade]: number;    // 2
  [PieceType.Regiment]: number;   // 2
  [PieceType.Battalion]: number;  // 2
  [PieceType.Company]: number;    // 3
  [PieceType.Platoon]: number;    // 3
  [PieceType.Engineer]: number;   // 3
  [PieceType.Bomb]: number;       // 2
  [PieceType.Mine]: number;       // 3
  [PieceType.Flag]: number;       // 1
}

// 标准棋子配置（每位玩家25枚棋子）
export const STANDARD_PIECE_CONFIG: PieceConfig = {
  [PieceType.Commander]: 1,
  [PieceType.General]: 1,
  [PieceType.Division]: 2,
  [PieceType.Brigade]: 2,
  [PieceType.Regiment]: 2,
  [PieceType.Battalion]: 2,
  [PieceType.Company]: 3,
  [PieceType.Platoon]: 3,
  [PieceType.Engineer]: 3,
  [PieceType.Bomb]: 2,
  [PieceType.Mine]: 3,
  [PieceType.Flag]: 1
};

// 棋子移动能力映射
export const PIECE_MOVEMENT_ABILITIES = {
  [PieceType.Commander]: { canMove: true, railwayBonus: false },
  [PieceType.General]: { canMove: true, railwayBonus: false },
  [PieceType.Division]: { canMove: true, railwayBonus: false },
  [PieceType.Brigade]: { canMove: true, railwayBonus: false },
  [PieceType.Regiment]: { canMove: true, railwayBonus: false },
  [PieceType.Battalion]: { canMove: true, railwayBonus: false },
  [PieceType.Company]: { canMove: true, railwayBonus: false },
  [PieceType.Platoon]: { canMove: true, railwayBonus: false },
  [PieceType.Engineer]: { canMove: true, railwayBonus: true }, // 工兵在铁路上可远距离移动
  [PieceType.Bomb]: { canMove: true, railwayBonus: false },
  [PieceType.Mine]: { canMove: false, railwayBonus: false },   // 地雷不能移动
  [PieceType.Flag]: { canMove: false, railwayBonus: false }    // 军旗不能移动
};

// 类型到等级的映射
export const TYPE_TO_RANK: Record<PieceType, PieceRank> = {
  [PieceType.Commander]: PieceRank.Commander,
  [PieceType.General]: PieceRank.General,
  [PieceType.Division]: PieceRank.Division,
  [PieceType.Brigade]: PieceRank.Brigade,
  [PieceType.Regiment]: PieceRank.Regiment,
  [PieceType.Battalion]: PieceRank.Battalion,
  [PieceType.Company]: PieceRank.Company,
  [PieceType.Platoon]: PieceRank.Platoon,
  [PieceType.Engineer]: PieceRank.Engineer,
  [PieceType.Bomb]: PieceRank.Bomb,
  [PieceType.Mine]: PieceRank.Mine,
  [PieceType.Flag]: PieceRank.Flag
};

// 等级到类型的映射
export const RANK_TO_TYPE: Record<PieceRank, PieceType> = {
  [PieceRank.Commander]: PieceType.Commander,
  [PieceRank.General]: PieceType.General,
  [PieceRank.Division]: PieceType.Division,
  [PieceRank.Brigade]: PieceType.Brigade,
  [PieceRank.Regiment]: PieceType.Regiment,
  [PieceRank.Battalion]: PieceType.Battalion,
  [PieceRank.Company]: PieceType.Company,
  [PieceRank.Platoon]: PieceType.Platoon,
  [PieceRank.Engineer]: PieceType.Engineer,
  [PieceRank.Bomb]: PieceType.Bomb,
  [PieceRank.Mine]: PieceType.Mine,
  [PieceRank.Flag]: PieceType.Flag
};

// 棋子中文名称映射
export const PIECE_NAMES: Record<PieceType, string> = {
  [PieceType.Commander]: '司令',
  [PieceType.General]: '军长',
  [PieceType.Division]: '师长',
  [PieceType.Brigade]: '旅长',
  [PieceType.Regiment]: '团长',
  [PieceType.Battalion]: '营长',
  [PieceType.Company]: '连长',
  [PieceType.Platoon]: '排长',
  [PieceType.Engineer]: '工兵',
  [PieceType.Bomb]: '炸弹',
  [PieceType.Mine]: '地雷',
  [PieceType.Flag]: '军旗'
};

// 工具函数：检查棋子是否可以移动
export function canPieceMove(piece: GamePiece): boolean {
  return piece.canMove && 
         piece.status === PieceStatus.Active && 
         PIECE_MOVEMENT_ABILITIES[piece.type].canMove;
}

// 工具函数：检查棋子是否有铁路移动加成
export function hasRailwayBonus(piece: GamePiece): boolean {
  return PIECE_MOVEMENT_ABILITIES[piece.type].railwayBonus;
}

// 工具函数：根据棋子类型创建棋子
export function createPiece(
  type: PieceType, 
  player: PlayerColor, 
  position: Position,
  id?: string
): GamePiece {
  return {
    id: id || `${player}_${type}_${Date.now()}`,
    type,
    rank: TYPE_TO_RANK[type],
    player,
    position,
    visibility: PieceVisibility.Visible, // 暂时为全明模式
    status: PieceStatus.Active,
    canMove: PIECE_MOVEMENT_ABILITIES[type].canMove
  };
}