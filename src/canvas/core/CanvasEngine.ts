import { 
  ICanvasEngine, 
  ICanvasLayer, 
  Point, 
  GridPosition, 
  CanvasEvent, 
  CanvasEventType,
  PerformanceInfo,
  CanvasRenderConfig,
  IDirtyRectManager
} from '../../types/canvas';
import { DirtyRectManager } from './DirtyRectManager';
import { PerformanceMonitor } from './PerformanceMonitor';

export class CanvasEngine implements ICanvasEngine {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  
  private layers: ICanvasLayer[] = [];
  private eventListeners: Map<string, Function[]> = new Map();
  private dirtyRectManager: IDirtyRectManager;
  private performanceMonitor: PerformanceMonitor;
  private config: CanvasRenderConfig;
  private animationFrame: number | null = null;
  private isRendering: boolean = false;
  
  // 坐标系统配置
  private gridConfig = {
    rows: 17,
    cols: 17,
    cellSize: 40,
    gap: 20,
    offsetX: 20,
    offsetY: 20
  };

  constructor(
    canvas: HTMLCanvasElement, 
    config: Partial<CanvasRenderConfig> = {}
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取Canvas 2D上下文');
    }
    this.ctx = ctx;
    
    // 配置初始化
    this.config = {
      enableDirtyRectOptimization: true,
      enableObjectPooling: true,
      maxFPS: 60,
      debugMode: false,
      pixelRatio: window.devicePixelRatio || 1,
      ...config
    };
    
    // 高DPI支持
    this.setupHighDPI();
    
    // 初始化管理器
    this.dirtyRectManager = new DirtyRectManager();
    this.performanceMonitor = new PerformanceMonitor();
    
    // 绑定事件监听器
    this.setupEventListeners();
    
    // 开始渲染循环
    this.startRenderLoop();
  }

  private setupHighDPI(): void {
    const pixelRatio = this.config.pixelRatio;
    const rect = this.canvas.getBoundingClientRect();

    // 设置Canvas内部分辨率
    this.canvas.width = rect.width * pixelRatio;
    this.canvas.height = rect.height * pixelRatio;

    // 设置Canvas显示尺寸
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    // 缩放绘图上下文以匹配设备像素比
    this.ctx.scale(pixelRatio, pixelRatio);

    // 设置文字和图像渲染优化
    this.ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in this.ctx) {
      (this.ctx as any).imageSmoothingQuality = 'high';
    }

    console.log('Canvas高DPI设置:', {
      pixelRatio,
      internalWidth: this.canvas.width,
      internalHeight: this.canvas.height,
      styleWidth: this.canvas.style.width,
      styleHeight: this.canvas.style.height
    });
  }

  private setupEventListeners(): void {
    const events: CanvasEventType[] = [
      'click', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout'
    ];
    
    events.forEach(eventType => {
      this.canvas.addEventListener(eventType, this.handleCanvasEvent.bind(this));
    });
  }

  private handleCanvasEvent(e: MouseEvent): void {
    const screenPoint: Point = { x: e.clientX, y: e.clientY };
    const canvasPoint = this.screenToCanvas(screenPoint);
    const gridPosition = this.canvasToGrid(canvasPoint);
    
    // 查找目标对象
    let target = null;
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const layer = this.layers[i];
      if (layer.visible) {
        target = layer.hitTest(canvasPoint);
        if (target) break;
      }
    }
    
    const canvasEvent: CanvasEvent = {
      type: e.type as CanvasEventType,
      canvasPoint,
      screenPoint,
      gridPosition,
      target: target || undefined,
      originalEvent: e
    };
    
    this.emit(e.type, canvasEvent);
  }

  // 渲染管理
  render(): void {
    if (this.isRendering) return;
    
    this.isRendering = true;
    const startTime = performance.now();
    
    try {
      if (this.config.enableDirtyRectOptimization) {
        this.renderDirtyRects();
      } else {
        this.renderFull();
      }
    } finally {
      const renderTime = performance.now() - startTime;
      this.performanceMonitor.recordRenderTime(renderTime);
      this.isRendering = false;
    }
  }

  private renderFull(): void {
    this.clear();
    
    // 按zIndex排序并渲染所有层
    const sortedLayers = [...this.layers]
      .filter(layer => layer.visible)
      .sort((a, b) => a.zIndex - b.zIndex);
    
    sortedLayers.forEach(layer => {
      try {
        layer.render(this.ctx);
        layer.clearDirty();
      } catch (error) {
        console.error(`❌ 层 ${layer.name} 渲染失败:`, error);
      }
    });
  }

  private renderDirtyRects(): void {
    const dirtyRects = this.dirtyRectManager.getDirtyRects();
    if (dirtyRects.length === 0) return;
    
    // 合并重叠的脏矩形
    const mergedRects = this.dirtyRectManager.merge();
    
    mergedRects.forEach(rect => {
      // 清除脏矩形区域
      this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
      
      // 重绘该区域内的所有层
      this.layers
        .filter(layer => layer.visible)
        .sort((a, b) => a.zIndex - b.zIndex)
        .forEach(layer => {
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.rect(rect.x, rect.y, rect.width, rect.height);
          this.ctx.clip();
          
          layer.render(this.ctx);
          
          this.ctx.restore();
        });
    });
    
    this.dirtyRectManager.clear();
    this.layers.forEach(layer => layer.clearDirty());
  }

  clear(): void {
    // 使用Canvas的实际尺寸清除
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    
    console.log('Canvas 重新设定尺寸:', { width, height });
    
    // 标记所有层为脏
    this.layers.forEach(layer => layer.markDirty());
    this.render();
  }

  // 层管理
  addLayer(layer: ICanvasLayer): void {
    this.layers.push(layer);
    this.layers.sort((a, b) => a.zIndex - b.zIndex);
    layer.markDirty();
  }

  removeLayer(layer: ICanvasLayer): void {
    const index = this.layers.indexOf(layer);
    if (index > -1) {
      this.layers.splice(index, 1);
      this.render();
    }
  }

  getLayer(name: string): ICanvasLayer | null {
    return this.layers.find(layer => layer.name === name) || null;
  }

  // 事件系统
  on(event: string, handler: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }

  // 坐标转换
  screenToCanvas(point: Point): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: point.x - rect.left,
      y: point.y - rect.top
    };
  }

  canvasToGrid(point: Point): GridPosition {
    const adjustedX = point.x - this.gridConfig.offsetX;
    const adjustedY = point.y - this.gridConfig.offsetY;
    
    const col = Math.floor(adjustedX / (this.gridConfig.cellSize + this.gridConfig.gap));
    const row = Math.floor(adjustedY / (this.gridConfig.cellSize + this.gridConfig.gap));
    
    // 确保在有效范围内
    const validRow = Math.max(0, Math.min(row, this.gridConfig.rows - 1));
    const validCol = Math.max(0, Math.min(col, this.gridConfig.cols - 1));
    
    return {
      row: validRow,
      col: validCol
    };
  }

  gridToCanvas(gridPos: GridPosition): Point {
    return {
      x: this.gridConfig.offsetX + gridPos.col * (this.gridConfig.cellSize + this.gridConfig.gap),
      y: this.gridConfig.offsetY + gridPos.row * (this.gridConfig.cellSize + this.gridConfig.gap)
    };
  }

  // 渲染循环
  private startRenderLoop(): void {
    const targetFrameTime = 1000 / this.config.maxFPS;
    let lastRenderTime = 0;
    
    const loop = (currentTime: number) => {
      const deltaTime = currentTime - lastRenderTime;
      
      if (deltaTime >= targetFrameTime) {
        // 检查是否需要重新渲染
        const needsRender = this.layers.some(layer => layer.isDirty()) || 
                           this.dirtyRectManager.getDirtyRects().length > 0;
        
        if (needsRender) {
          this.render();
        }
        
        this.performanceMonitor.recordFrame(currentTime);
        lastRenderTime = currentTime;
      }
      
      this.animationFrame = requestAnimationFrame(loop);
    };
    
    this.animationFrame = requestAnimationFrame(loop);
  }

  // 性能监控
  getPerformanceInfo(): PerformanceInfo {
    return this.performanceMonitor.getInfo();
  }

  // 清理资源
  dispose(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    // 清理事件监听器
    this.eventListeners.clear();
    this.layers.forEach(layer => this.removeLayer(layer));
  }
}