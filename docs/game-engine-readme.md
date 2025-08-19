# 四国军棋游戏规则引擎

## 📋 概述

这是一个完整的四国军棋游戏规则引擎，实现了标准四国军棋的所有核心规则，包括：

- ✅ 完整的棋子等级系统（司令40到排长31，特殊棋子）
- ✅ 严格的移动规则验证
- ✅ 准确的战斗规则实现
- ✅ 联盟关系管理（红蓝vs黄绿）
- ✅ 胜负判断系统
- ✅ 游戏状态管理和持久化
- ✅ 完善的单元测试（覆盖率>90%）

## 🏗 架构设计

```
src/game/
├── core/                    # 核心游戏逻辑
│   ├── GameEngine.ts        # 游戏引擎主类
│   ├── GameRules.ts         # 游戏规则实现
│   ├── GameState.ts         # 状态管理
│   ├── MoveValidator.ts     # 移动验证器
│   └── __tests__/          # 单元测试
├── pieces/                  # 棋子系统
│   └── PieceTypes.ts        # 棋子类型定义
└── examples/                # 使用示例
    └── GameEngineExample.ts
```

## 🚀 快速开始

### 基本使用

```typescript
import { GameEngine } from './src/game/core/GameEngine';
import { PlayerColor } from './src/game/pieces/PieceTypes';

// 1. 创建游戏实例
const gameEngine = new GameEngine();

// 2. 初始化棋子和棋盘
gameEngine.initializePieces();
gameEngine.autoDeployPieces();

// 3. 获取游戏状态
const gameState = gameEngine.getGameState();
console.log('当前玩家:', gameState.turnInfo.currentPlayer);

// 4. 执行移动
try {
  const moveRecord = gameEngine.makeMove(
    { row: 12, col: 8 },  // 起始位置
    { row: 11, col: 8 }   // 目标位置
  );
  console.log('移动成功:', moveRecord.id);
} catch (error) {
  console.log('移动失败:', error.message);
}

// 5. 清理资源
gameEngine.destroy();
```

### 棋子等级系统

```typescript
import { PieceRank, PieceType } from './src/game/pieces/PieceTypes';

// 棋子等级（数值越大越强）
console.log(PieceRank.Commander);    // 40 (司令)
console.log(PieceRank.General);      // 39 (军长)
console.log(PieceRank.Engineer);     // 32 (工兵)
console.log(PieceRank.Bomb);         // -1 (炸弹)
console.log(PieceRank.Mine);         // -2 (地雷)
console.log(PieceRank.Flag);         // -3 (军旗)
```

### 战斗规则验证

```typescript
import { GameRules } from './src/game/core/GameRules';
import { createPiece } from './src/game/pieces/PieceTypes';

// 创建棋子
const commander = createPiece(PieceType.Commander, PlayerColor.Red, { row: 0, col: 0 });
const platoon = createPiece(PieceType.Platoon, PlayerColor.Green, { row: 0, col: 1 });

// 模拟战斗
const battleResult = GameRules.resolveBattle(commander, platoon);
console.log('战斗结果:', battleResult.result);    // 'attacker_wins'
console.log('获胜者:', battleResult.winner?.type);  // 'commander'
```

### 移动规则检查

```typescript
import { MoveValidator } from './src/game/core/MoveValidator';

// 详细移动验证
const moveResult = MoveValidator.validateMove(
  piece,
  { row: 8, col: 8 },
  { row: 8, col: 9 },
  board
);

console.log('移动是否合法:', moveResult.isValid);
console.log('移动类型:', moveResult.moveType);      // 'normal', 'attack', 'railway'
console.log('移动路径:', moveResult.path);
```

## 🎮 核心功能

### 1. 棋子系统

- **标准配置**: 每位玩家25枚棋子
- **等级关系**: 司令(40) > 军长(39) > ... > 工兵(32)
- **特殊棋子**: 炸弹、地雷、军旗有特殊规则
- **移动能力**: 工兵可在铁路上远距离移动

#### 棋子摆放规则

每个玩家在游戏开始时需要将25枚棋子摆放在自己的区域内：

**摆放区域定义**：
- **绿方**：棋盘上方区域（行0-5，列6-10）
- **蓝方**：棋盘左侧区域（行6-10，列0-5）
- **红方**：棋盘右侧区域（行6-10，列11-16）
- **黄方**：棋盘下方区域（行11-16，列6-10）

**行营排除规则**：
棋子不能摆放在行营格子上。各方行营坐标如下：
- 绿方行营：`[2,7], [2,9], [3,8], [4,7], [4,9]`
- 蓝方行营：`[7,2], [9,2], [8,3], [7,4], [9,4]`
- 红方行营：`[7,12], [9,12], [8,13], [7,14], [9,14]`
- 黄方行营：`[12,7], [12,9], [13,8], [14,7], [14,9]`

**摆放约束**：
- 每个玩家必须摆放完整的25枚棋子
- 棋子只能摆放在自己区域的非行营位置
- 行营格子保留为空，供游戏过程中棋子休息使用
- 自动摆放算法会智能避开行营位置，确保25枚棋子都有合适的摆放位置

**特殊棋子摆放规则**：

1. **军旗摆放规则**（最高优先级）：
   - **固定位置**：军旗必须摆放在各玩家的大本营位置
   - **大本营坐标**：
     - 绿方：`[0, 7], [0, 9]`
     - 蓝方：`[7, 0], [9, 0]`
     - 红方：`[7, 16], [9, 16]`
     - 黄方：`[16, 7], [16, 9]`

2. **其他特殊棋子摆放规则**：
   - **后排优先**：地雷、炸弹优先摆放在远离中心的后排位置
   - **前排限制**：地雷、炸弹不能摆放在靠近中央交汇区域的前排
   - **分类摆放**：普通棋子（司令、军长等）优先占据前排

3. **边界控制和区域限制**：
   - **严格边界**：防止棋子越界到中央交汇区域
   - **排除军营**：所有棋子均不能摆放在军营格子上
   - **区域定义**：
     - 红方：行11-16，列6-10（下方区域）
     - 绿方：行0-5，列6-10（上方区域）
     - 蓝方：行6-10，列0-5（左侧区域）
     - 黄方：行6-10，列11-16（右侧区域）

### 2. 战斗规则

- **等级对战**: 高等级棋子获胜
- **同级对战**: 同归于尽
- **工兵挖雷**: 工兵可以安全挖掉地雷
- **炸弹规则**: 炸弹与任何棋子同归于尽
- **军旗夺取**: 任何棋子都能夺取军旗

### 3. 联盟系统

- **红蓝联盟**: 红色和蓝色玩家互为盟友
- **黄绿联盟**: 黄色和绿色玩家互为盟友
- **盟友保护**: 盟友棋子不能相互攻击
- **联盟胜利**: 整个联盟获胜，不存在个人胜利

### 4. 移动系统

- **基本移动**: 一次移动一步，上下左右
- **路径检查**: 不能跨越其他棋子
- **工兵特权**: 工兵在铁路上可远距离移动
- **A*路径搜索**: 复杂路径的智能计算

### 5. 胜负判断

- **败北条件**:
  - 军旗被夺取
  - 所有可移动棋子被消灭
- **胜利条件**:
  - 对方联盟的两名玩家都败北

## 🧪 测试覆盖

项目包含完整的单元测试，覆盖率超过90%：

```bash
# 运行测试
npm test

# 测试覆盖率报告
npm run test:coverage
```

### 测试文件

- `GameRules.test.ts`: 游戏规则测试
- `MoveValidator.test.ts`: 移动验证测试  
- `GameEngine.test.ts`: 游戏引擎测试
- `PieceTypes.test.ts`: 棋子类型测试

## 📝 API参考

### GameEngine类

主要的游戏引擎类，管理整个游戏生命周期。

#### 方法

```typescript
// 游戏初始化
initializePieces(): void
autoDeployPieces(): void

// 游戏操作
makeMove(from: Position, to: Position): MoveRecord | null
getCurrentPlayerMovablePieces(): GamePiece[]
getPieceAtPosition(position: Position): GamePiece | null

// 状态查询
getGameState(): GameState
getPlayerPieces(player: PlayerColor): GamePiece[]

// 资源管理
destroy(): void
```

### GameRules类

静态工具类，提供游戏规则验证。

#### 静态方法

```typescript
// 联盟关系
getAllianceType(player1: PlayerColor, player2: PlayerColor): AllianceType

// 战斗系统
resolveBattle(attacker: GamePiece, defender: GamePiece): BattleDetails

// 移动验证
canMovePiece(piece: GamePiece, from: Position, to: Position, board: Board): MoveResult

// 胜负判断
isPlayerDefeated(playerPieces: GamePiece[]): boolean
checkAllianceVictory(allPlayerPieces: Map<PlayerColor, GamePiece[]>): PlayerColor[] | null

// 辅助工具
getPossibleMoves(piece: GamePiece, board: Board): Position[]
```

### MoveValidator类

高级移动验证和路径计算。

#### 静态方法

```typescript
// 详细验证
validateMove(piece: GamePiece, from: Position, to: Position, board: Board): DetailedMoveResult

// 路径计算
calculatePath(from: Position, to: Position, board: Board, piece: GamePiece): Position[]
findPathAStar(from: Position, to: Position, board: Board, piece: GamePiece): Position[]

// 辅助功能
getAllValidMoves(piece: GamePiece, board: Board): DetailedMoveResult[]
isPositionThreatened(position: Position, byPlayer: PlayerColor, board: Board): boolean
calculateMoveValue(moveResult: DetailedMoveResult, piece: GamePiece): number
```

## 🔧 配置选项

### 游戏时间设置

```typescript
// 在GameEngine构造函数中配置
const TURN_TIME_LIMIT = 30; // 每回合30秒
```

### 棋子配置

```typescript
// 自定义棋子数量（标准配置在STANDARD_PIECE_CONFIG中）
const customConfig: PieceConfig = {
  [PieceType.Commander]: 1,
  [PieceType.General]: 1,
  // ... 更多配置
};
```

## 🎯 使用场景

### 1. 完整游戏开发

```typescript
// 创建完整的四国军棋游戏
const game = new GameEngine();
game.initializePieces();
game.autoDeployPieces();

// 游戏循环
while (game.getGameState().phase === GamePhase.Playing) {
  const movablePieces = game.getCurrentPlayerMovablePieces();
  // 处理用户输入或AI决策
  // game.makeMove(from, to);
}
```

### 2. 规则验证工具

```typescript
// 验证移动是否合法
const isValid = GameRules.canMovePiece(piece, from, to, board);

// 获取所有可能移动
const moves = GameRules.getPossibleMoves(piece, board);
```

### 3. AI开发

```typescript
// 评估移动价值
const moves = MoveValidator.getAllValidMoves(piece, board);
moves.forEach(move => {
  const value = MoveValidator.calculateMoveValue(move, piece);
  // 用于AI决策
});
```

## 🚨 注意事项

1. **内存管理**: 游戏结束后记得调用`destroy()`清理资源
2. **状态一致性**: 不要直接修改返回的游戏状态对象
3. **异步处理**: 移动执行是同步的，可以安全地连续调用
4. **错误处理**: 所有非法操作都会抛出有意义的错误信息

## 🔮 扩展性

引擎设计具有良好的扩展性：

- **自定义规则**: 继承GameRules类添加新规则
- **AI集成**: 实现AI接口进行决策
- **网络同步**: 状态可序列化用于网络传输
- **回放系统**: 移动历史支持游戏回放

## 📈 性能特性

- **高效路径搜索**: A*算法优化的路径计算
- **状态缓存**: 智能缓存减少重复计算
- **内存优化**: 合理的对象复用和垃圾回收
- **时间复杂度**: 大部分操作都是O(1)或O(n)

---

更多详细信息请参考源代码注释和测试用例。