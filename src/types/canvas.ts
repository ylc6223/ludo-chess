// Canvas渲染系统类型定义

// 基础几何类型
export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 网格位置
export interface GridPosition {
  row: number;
  col: number;
}

// 渲染层接口
export interface ICanvasLayer {
  readonly name: string;
  readonly zIndex: number;
  visible: boolean;
  
  render(ctx: CanvasRenderingContext2D): void;
  isDirty(): boolean;
  markDirty(rect?: Rectangle): void;
  clearDirty(): void;
  getBounds(): Rectangle;
  hitTest(point: Point): Drawable | null;
}

// 可绘制对象基类接口
export interface IDrawable {
  readonly id: string;
  position: Point;
  size: Size;
  visible: boolean;
  zIndex: number;
  
  draw(ctx: CanvasRenderingContext2D): void;
  hitTest(point: Point): boolean;
  getBounds(): Rectangle;
  markDirty(): void;
}

// 可绘制对象抽象类
export abstract class Drawable implements IDrawable {
  readonly id: string;
  position: Point;
  size: Size;
  visible: boolean = true;
  zIndex: number = 0;
  protected _isDirty: boolean = true;
  protected onDirtyCallback?: (rect: Rectangle) => void;

  constructor(id: string, position: Point, size: Size) {
    this.id = id;
    this.position = position;
    this.size = size;
  }

  abstract draw(ctx: CanvasRenderingContext2D): void;
  
  hitTest(point: Point): boolean {
    const bounds = this.getBounds();
    return point.x >= bounds.x && point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y && point.y <= bounds.y + bounds.height;
  }
  
  getBounds(): Rectangle {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.size.width,
      height: this.size.height
    };
  }
  
  markDirty(): void {
    this._isDirty = true;
    if (this.onDirtyCallback) {
      this.onDirtyCallback(this.getBounds());
    }
  }

  setDirtyCallback(callback: (rect: Rectangle) => void): void {
    this.onDirtyCallback = callback;
  }
}

// Canvas渲染引擎接口
export interface ICanvasEngine {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  
  // 渲染管理
  render(): void;
  clear(): void;
  resize(width: number, height: number): void;
  
  // 层管理
  addLayer(layer: ICanvasLayer): void;
  removeLayer(layer: ICanvasLayer): void;
  getLayer(name: string): ICanvasLayer | null;
  
  // 事件系统
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
  emit(event: string, ...args: any[]): void;
  
  // 坐标转换
  screenToCanvas(point: Point): Point;
  canvasToGrid(point: Point): GridPosition;
  gridToCanvas(gridPos: GridPosition): Point;
  
  // 性能监控
  getPerformanceInfo(): PerformanceInfo;
}

// Canvas事件类型
export type CanvasEventType = 
  | 'click' 
  | 'mousedown' 
  | 'mouseup' 
  | 'mousemove' 
  | 'mouseover' 
  | 'mouseout'
  | 'drag'
  | 'drop';

export interface CanvasEvent {
  type: CanvasEventType;
  canvasPoint: Point;
  screenPoint: Point;
  gridPosition?: GridPosition;
  target?: Drawable;
  originalEvent: MouseEvent;
}

// 动画相关类型
export interface AnimationOptions {
  duration: number;
  easing?: EasingFunction;
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
}

export type EasingFunction = (t: number) => number;

export interface IAnimation {
  readonly id: string;
  readonly target: any;
  readonly property: string;
  readonly from: any;
  readonly to: any;
  readonly duration: number;
  
  update(deltaTime: number): boolean; // returns true if animation is complete
  stop(): void;
  pause(): void;
  resume(): void;
}

// 性能监控类型
export interface PerformanceInfo {
  fps: number;
  renderTime: number;
  memoryUsage: number;
  drawCalls: number;
  dirtyRegions: number;
}

// 渲染配置
export interface CanvasRenderConfig {
  enableDirtyRectOptimization: boolean;
  enableObjectPooling: boolean;
  maxFPS: number;
  debugMode: boolean;
  pixelRatio: number;
}

// 缓解函数预设
export const Easings = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  elastic: (t: number) => Math.sin(-13 * (t + 1) * Math.PI / 2) * Math.pow(2, -10 * t) + 1
};

// 对象池接口
export interface IObjectPool<T> {
  get(): T;
  release(obj: T): void;
  clear(): void;
  size(): number;
}

// 脏矩形管理器接口
export interface IDirtyRectManager {
  markDirty(rect: Rectangle): void;
  getDirtyRects(): Rectangle[];
  clear(): void;
  merge(): Rectangle[];
}