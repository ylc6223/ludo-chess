# Canvas绘制重构方案

## 🎯 重构目标

将当前基于DOM的棋盘和棋子渲染系统重构为高性能的Canvas绘制系统，实现：
- **性能提升60%+**: 减少DOM操作，提升渲染帧率
- **内存优化50%+**: 单一Canvas替代数百个DOM节点
- **流畅动画**: 60FPS的棋子移动和视觉效果
- **响应式交互**: 低延迟的用户交互体验

## 📊 性能问题分析

### 当前DOM渲染痛点

| 问题 | 现状 | 影响 |
|------|------|------|
| DOM节点数量 | 289个格子 + 连接线 + 棋子 ≈ 500+ | 内存占用高，渲染慢 |
| 重排重绘频率 | 每次状态变更触发大量重排 | 卡顿，响应慢 |
| 事件监听开销 | 每个格子独立监听器 | CPU占用高 |
| 动画性能 | 依赖CSS transition | 不够流畅 |
| 可扩展性 | 节点数随棋盘大小平方增长 | 扩展困难 |

### 性能基准测试

**预期性能提升**:
- 首次渲染: 600ms → 200ms (⬇️ 67%)
- 重绘时间: 16ms → 4ms (⬇️ 75%) 
- 内存占用: 32MB → 18MB (⬇️ 44%)
- 动画帧率: 30fps → 60fps (⬆️ 100%)

## 🏗️ Canvas架构设计

### 分层渲染架构

```
Canvas渲染系统
├── 背景层 (Background Layer)
│   ├── 棋盘网格绘制
│   ├── 区域颜色填充  
│   └── 静态装饰元素
├── 连接层 (Connection Layer)
│   ├── 铁路连接线
│   ├── 对角连接线
│   └── 边界连接线
├── 棋子层 (Piece Layer)
│   ├── 棋子基础绘制
│   ├── 棋子状态显示
│   └── 选中高亮效果
├── 交互层 (Interaction Layer)
│   ├── 有效移动提示
│   ├── 悬停效果
│   └── 选中框显示
└── UI层 (UI Layer)
    ├── 坐标标识
    ├── 状态信息
    └── 调试信息
```

### 渲染策略

#### 1. 多Canvas分层
- **背景Canvas**: 静态棋盘，缓存不变
- **动态Canvas**: 棋子和交互效果
- **UI Canvas**: 界面元素和提示

#### 2. 脏矩形更新
- 只重绘变化的区域
- 智能检测需要更新的矩形区域
- 批量合并相邻的更新区域

#### 3. 对象池复用
- 复用绘制对象，减少GC压力
- 预分配常用图形资源
- 智能内存管理

## 🔧 技术实现方案

### Canvas渲染引擎架构

```typescript
// 核心渲染引擎
interface ICanvasEngine {
  // 渲染管理
  render(): void;
  clear(): void;
  resize(width: number, height: number): void;
  
  // 层管理
  addLayer(layer: ICanvasLayer): void;
  removeLayer(layer: ICanvasLayer): void;
  
  // 事件系统
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
}

// 渲染层接口
interface ICanvasLayer {
  render(ctx: CanvasRenderingContext2D): void;
  isDirty(): boolean;
  markDirty(): void;
  getBounds(): Rectangle;
}
```

### 绘制对象模型

```typescript
// 可绘制对象基类
abstract class Drawable {
  position: Point;
  size: Size;
  visible: boolean;
  zIndex: number;
  
  abstract draw(ctx: CanvasRenderingContext2D): void;
  abstract hitTest(point: Point): boolean;
  getBounds(): Rectangle;
}

// 棋盘格子
class BoardCell extends Drawable {
  type: CellType;
  style: CellStyle;
  
  draw(ctx: CanvasRenderingContext2D): void;
  hitTest(point: Point): boolean;
}

// 棋子对象
class ChessPiece extends Drawable {
  pieceType: PieceType;
  player: PlayerType;
  status: PieceStatus;
  
  draw(ctx: CanvasRenderingContext2D): void;
  animate(property: string, targetValue: any, duration: number): void;
}
```

### 事件交互系统

```typescript
// 事件管理器
class CanvasEventManager {
  private canvas: HTMLCanvasElement;
  private hitTestLayers: ICanvasLayer[];
  
  // 坐标转换
  screenToCanvas(screenPoint: Point): Point;
  canvasToBoard(canvasPoint: Point): GridPosition;
  
  // 碰撞检测
  hitTest(point: Point): Drawable[];
  
  // 事件分发
  dispatchEvent(event: CanvasEvent): void;
}
```

## 📋 实施计划

### 第一阶段：基础架构 (Week 1)

#### 1.1 创建Canvas渲染引擎
- [ ] CanvasEngine核心类
- [ ] 多层渲染系统
- [ ] 基础绘制工具类

#### 1.2 坐标系统设计
- [ ] 屏幕坐标 ↔ Canvas坐标转换
- [ ] Canvas坐标 ↔ 棋盘网格转换
- [ ] 响应式缩放计算

#### 1.3 事件系统基础
- [ ] 鼠标事件捕获和转换
- [ ] 碰撞检测算法
- [ ] 事件分发机制

### 第二阶段：棋盘绘制 (Week 2)

#### 2.1 棋盘背景渲染
- [ ] 网格线绘制
- [ ] 区域颜色填充
- [ ] 特殊标记（军营、大本营）

#### 2.2 连接线系统
- [ ] 基础连接线算法
- [ ] 对角线连接逻辑
- [ ] 连接线样式配置

#### 2.3 渲染优化
- [ ] 背景缓存机制
- [ ] 脏矩形更新
- [ ] 视口裁剪优化

### 第三阶段：棋子系统 (Week 3)

#### 3.1 棋子绘制引擎
- [ ] 棋子基础形状绘制
- [ ] 文字渲染和样式
- [ ] 状态效果绘制

#### 3.2 动画系统
- [ ] 补间动画引擎
- [ ] 移动轨迹计算
- [ ] 缓动函数库

#### 3.3 交互效果
- [ ] 选中高亮效果
- [ ] 悬停状态显示
- [ ] 有效移动提示

### 第四阶段：性能优化 (Week 4)

#### 4.1 渲染性能优化
- [ ] 对象池实现
- [ ] 批量绘制优化
- [ ] GPU加速探索

#### 4.2 内存优化
- [ ] 智能垃圾回收
- [ ] 纹理资源管理
- [ ] 内存泄漏检测

#### 4.3 用户体验优化
- [ ] loading状态处理
- [ ] 错误边界处理
- [ ] 性能监控面板

## 🚀 性能优化策略

### 1. 渲染优化
```typescript
// 脏矩形更新示例
class DirtyRectManager {
  private dirtyRects: Rectangle[] = [];
  
  markDirty(rect: Rectangle): void {
    // 合并重叠的矩形
    this.dirtyRects = this.mergeOverlappingRects([...this.dirtyRects, rect]);
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    this.dirtyRects.forEach(rect => {
      ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
      // 只重绘脏矩形区域内的对象
      this.renderRect(ctx, rect);
    });
    this.dirtyRects = [];
  }
}
```

### 2. 动画优化
```typescript
// 高性能动画系统
class AnimationEngine {
  private animations: Animation[] = [];
  
  animate(target: Drawable, property: string, to: any, duration: number): void {
    // 使用requestAnimationFrame
    const animation = new Animation(target, property, to, duration);
    this.animations.push(animation);
  }
  
  update(deltaTime: number): void {
    // 批量更新所有动画
    this.animations = this.animations.filter(anim => {
      const finished = anim.update(deltaTime);
      if (finished) anim.onComplete?.();
      return !finished;
    });
  }
}
```

### 3. 内存优化
```typescript
// 对象池优化
class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  
  get(): T {
    return this.pool.pop() || this.createFn();
  }
  
  release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}
```

## 🧪 质量保证

### 性能基准测试
```typescript
// 性能测试套件
const performanceTests = {
  renderTime: () => measureRenderTime(),
  memoryUsage: () => measureMemoryUsage(), 
  animationFPS: () => measureAnimationFPS(),
  interactionLatency: () => measureInteractionLatency()
};
```

### 兼容性测试
- Canvas 2D API支持检测
- 高DPI屏幕适配测试
- 移动设备触摸事件测试
- 低端设备性能测试

## 📈 预期收益

### 性能提升
| 指标 | DOM版本 | Canvas版本 | 提升 |
|------|---------|------------|------|
| 首次渲染 | 600ms | 200ms | ⬆️ 200% |
| 重绘时间 | 16ms | 4ms | ⬆️ 300% |
| 内存占用 | 32MB | 18MB | ⬇️ 44% |
| 动画帧率 | 30fps | 60fps | ⬆️ 100% |

### 用户体验
- ✅ 流畅的60FPS动画
- ✅ 即时的交互响应
- ✅ 无卡顿的缩放体验  
- ✅ 支持更复杂的视觉效果

### 开发体验
- ✅ 统一的绘制API
- ✅ 强大的调试工具
- ✅ 灵活的扩展能力
- ✅ 完善的类型定义

## 🛠️ 技术栈

### 核心技术
- **Canvas 2D API**: 基础绘制能力
- **RequestAnimationFrame**: 高性能动画
- **TypeScript**: 类型安全的架构
- **React Hooks**: 状态管理和生命周期

### 工具库
- **事件处理**: 自研高效事件系统
- **动画引擎**: 自研补间动画库  
- **几何计算**: 碰撞检测和坐标转换
- **性能监控**: 渲染性能实时监控

---

**Canvas重构将为项目带来质的飞跃，实现高性能、流畅的用户体验！** 🚀

*最后更新: 2025-08-18*