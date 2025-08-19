/**
 * 游戏引擎使用示例
 * 演示如何使用游戏引擎进行基本的游戏操作
 */

import { GameEngine } from '../core/GameEngine';
import { PlayerColor, PieceType, GamePiece, createPiece } from '../pieces/PieceTypes';
import { GameRules } from '../core/GameRules';

/**
 * 基础游戏示例
 */
export function basicGameExample(): void {
  console.log('=== 四国军棋游戏引擎示例 ===\n');

  // 1. 创建游戏实例
  const gameEngine = new GameEngine();
  console.log('✅ 创建游戏实例');

  // 2. 初始化棋子
  gameEngine.initializePieces();
  console.log('✅ 初始化所有玩家棋子（每人25枚）');

  // 3. 自动部署棋子
  gameEngine.autoDeployPieces();
  console.log('✅ 自动部署棋子到棋盘');

  // 4. 获取游戏状态
  const gameState = gameEngine.getGameState();
  console.log(`📊 游戏状态: ${gameState.phase}`);
  console.log(`🎯 当前玩家: ${gameState.turnInfo.currentPlayer}`);
  console.log(`🔄 回合数: ${gameState.turnInfo.turnNumber}`);

  // 5. 检查当前玩家的可移动棋子
  const movablePieces = gameEngine.getCurrentPlayerMovablePieces();
  console.log(`🚶 ${gameState.turnInfo.currentPlayer}玩家有 ${movablePieces.length} 个可移动棋子`);

  // 6. 尝试执行一个移动
  if (movablePieces.length > 0) {
    const piece = movablePieces[0];
    if (piece.position) {
      const possibleMoves = GameRules.getPossibleMoves(piece, gameState.board, false);
      
      if (possibleMoves.length > 0) {
        const targetPos = possibleMoves[0];
        
        console.log(`\n🎮 执行移动:`);
        console.log(`   棋子: ${piece.type} (${piece.player})`);
        console.log(`   从: (${piece.position.row}, ${piece.position.col})`);
        console.log(`   到: (${targetPos.row}, ${targetPos.col})`);
        
        try {
          const moveRecord = gameEngine.makeMove(piece.position, targetPos);
          console.log(`✅ 移动成功! 移动ID: ${moveRecord?.id}`);
          
          const updatedState = gameEngine.getGameState();
          console.log(`🔄 轮到下一个玩家: ${updatedState.turnInfo.currentPlayer}`);
        } catch (error) {
          console.log(`❌ 移动失败: ${error}`);
        }
      }
    }
  }

  // 7. 显示棋盘统计
  showBoardStatistics(gameEngine);

  // 8. 清理资源
  gameEngine.destroy();
  console.log('\n✅ 游戏实例已清理');
}

/**
 * 战斗规则示例
 */
export function battleRulesExample(): void {
  console.log('\n=== 战斗规则演示 ===\n');

  // 创建不同类型的棋子进行战斗演示
  const testBattles = [
    {
      attacker: { type: PieceType.Commander, player: PlayerColor.Red },
      defender: { type: PieceType.Platoon, player: PlayerColor.Green },
      description: '司令 vs 排长'
    },
    {
      attacker: { type: PieceType.Engineer, player: PlayerColor.Red },
      defender: { type: PieceType.Mine, player: PlayerColor.Green },
      description: '工兵挖雷'
    },
    {
      attacker: { type: PieceType.Commander, player: PlayerColor.Red },
      defender: { type: PieceType.Bomb, player: PlayerColor.Green },
      description: '司令碰炸弹'
    },
    {
      attacker: { type: PieceType.General, player: PlayerColor.Red },
      defender: { type: PieceType.General, player: PlayerColor.Green },
      description: '同级对战'
    },
    {
      attacker: { type: PieceType.Platoon, player: PlayerColor.Red },
      defender: { type: PieceType.Flag, player: PlayerColor.Green },
      description: '夺取军旗'
    }
  ];

  testBattles.forEach((battle, index) => {
    const attacker = createPiece(
      battle.attacker.type,
      battle.attacker.player,
      { row: 0, col: 0 },
      `attacker_${index}`
    );

    const defender = createPiece(
      battle.defender.type,
      battle.defender.player,
      { row: 0, col: 1 },
      `defender_${index}`
    );

    console.log(`⚔️ ${battle.description}:`);
    
    try {
      const battleResult = GameRules.resolveBattle(attacker, defender);
      
      console.log(`   结果: ${battleResult.result}`);
      console.log(`   获胜者: ${battleResult.winner?.type || '无'}`);
      console.log(`   被消灭: ${battleResult.eliminated.map(p => p.type).join(', ') || '无'}`);
    } catch (error) {
      console.log(`   错误: ${error}`);
    }
    console.log('');
  });
}

/**
 * 移动规则示例
 */
export function moveRulesExample(): void {
  console.log('\n=== 移动规则演示 ===\n');

  // 创建简单的测试棋盘
  const board: (GamePiece | null)[][] = Array(17).fill(null).map(() => Array(17).fill(null));
  
  // 放置一个司令在中央
  const commander = createPiece(
    PieceType.Commander,
    PlayerColor.Red,
    { row: 8, col: 8 },
    'test_commander'
  );
  board[8][8] = commander;

  console.log('🏰 测试司令的移动规则:');
  
  // 测试各种移动
  const testMoves = [
    { to: { row: 8, col: 9 }, description: '向右移动一步' },
    { to: { row: 8, col: 10 }, description: '向右移动两步（应该失败）' },
    { to: { row: 9, col: 9 }, description: '斜向移动（应该失败）' },
    { to: { row: 7, col: 8 }, description: '向上移动一步' },
    { to: { row: -1, col: 8 }, description: '移动到边界外（应该失败）' }
  ];

  testMoves.forEach(testMove => {
    const result = GameRules.canMovePiece(commander, commander.position!, testMove.to, board);
    const status = result.isValid ? '✅' : '❌';
    const reason = result.isValid ? '' : ` - ${result.reason}`;
    
    console.log(`   ${status} ${testMove.description}${reason}`);
  });

  // 测试工兵的特殊移动
  const engineer = createPiece(
    PieceType.Engineer,
    PlayerColor.Red,
    { row: 5, col: 5 },
    'test_engineer'
  );
  board[5][5] = engineer;

  console.log('\n🔧 测试工兵的铁路移动:');
  
  const engineerMoves = [
    { to: { row: 5, col: 10 }, description: '水平远距离移动' },
    { to: { row: 10, col: 5 }, description: '垂直远距离移动' }
  ];

  engineerMoves.forEach(testMove => {
    const result = GameRules.canMovePiece(engineer, engineer.position!, testMove.to, board);
    const status = result.isValid ? '✅' : '❌';
    const reason = result.isValid ? '' : ` - ${result.reason}`;
    
    console.log(`   ${status} ${testMove.description}${reason}`);
  });
}

/**
 * 显示棋盘统计信息
 */
function showBoardStatistics(gameEngine: GameEngine): void {
  const gameState = gameEngine.getGameState();
  
  console.log('\n📊 棋盘统计:');
  
  // 统计每个玩家的棋子数量
  gameState.players.forEach((player, color) => {
    const activePieces = player.pieces.filter(p => p.status === 'active');
    const piecesOnBoard = activePieces.filter(p => p.position !== null);
    
    console.log(`   ${color}: ${piecesOnBoard.length}/${activePieces.length} 棋子在棋盘上`);
  });

  // 统计棋盘上的总棋子数
  let totalPiecesOnBoard = 0;
  for (let row = 0; row < 17; row++) {
    for (let col = 0; col < 17; col++) {
      if (gameState.board[row][col]) {
        totalPiecesOnBoard++;
      }
    }
  }
  console.log(`   总计: ${totalPiecesOnBoard} 枚棋子在棋盘上`);

  // 移动历史
  console.log(`   移动历史: ${gameState.moveHistory.length} 步`);
}

/**
 * 运行所有示例
 */
export function runAllExamples(): void {
  try {
    basicGameExample();
    battleRulesExample();
    moveRulesExample();
    
    console.log('\n🎉 所有示例执行完成！');
  } catch (error) {
    console.error('❌ 示例执行出错:', error);
  }
}

// 如果直接运行此文件，执行示例
if (require.main === module) {
  runAllExamples();
}