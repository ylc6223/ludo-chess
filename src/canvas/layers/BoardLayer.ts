import { ICanvasLayer, Point, Rectangle, Drawable } from '../../types/canvas';
import { BoardData } from '../../types/board';
import { BoardConfig } from '../../config/boardConfig';
import { boardDataService } from '../../services/boardDataService';
import { connectionService } from '../../services/connectionService';

export class BoardLayer implements ICanvasLayer {
  readonly name = 'board';
  readonly zIndex = 1; // 棋盘在连接线上方
  visible = true;

  private boardData: BoardData;
  private config: BoardConfig;
  private _isDirty = true;
  private cachedCanvas: HTMLCanvasElement | null = null;
  private cachedCtx: CanvasRenderingContext2D | null = null;

  // 共享的缩放计算方法
  static calculateScaleAndOffset(canvas: HTMLCanvasElement, boardData: BoardData) {
    const { cellSize, gap, rows, cols } = boardData.dimensions;
    
    const theoreticalBoardWidth = cols * cellSize + (cols - 1) * gap;
    const theoreticalBoardHeight = rows * cellSize + (rows - 1) * gap;
    
    const margin = 40;
    const availableWidth = canvas.width - margin * 2;
    const availableHeight = canvas.height - margin * 2;
    
    const scaleX = availableWidth / theoreticalBoardWidth;
    const scaleY = availableHeight / theoreticalBoardHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const scaledCellSize = cellSize * scale;
    const scaledGap = gap * scale;
    
    const actualBoardWidth = cols * scaledCellSize + (cols - 1) * scaledGap;
    const actualBoardHeight = rows * scaledCellSize + (rows - 1) * scaledGap;
    const scaledOffsetX = (canvas.width - actualBoardWidth) / 2;
    const scaledOffsetY = (canvas.height - actualBoardHeight) / 2;
    
    return {
      scale,
      scaledCellSize,
      scaledGap,
      scaledOffsetX,
      scaledOffsetY,
      actualBoardWidth,
      actualBoardHeight
    };
  }

  constructor(config: BoardConfig) {
    this.config = config;
    this.boardData = boardDataService.createBoardData();
    // 强制清理连接线缓存以确保使用最新逻辑
    connectionService.clearCache();
    this.boardData.connections = connectionService.generateConnections(this.boardData);
    this.setupCache();
  }

  private setupCache(): void {
    // 创建离屏Canvas用于缓存静态棋盘
    this.cachedCanvas = document.createElement('canvas');
    this.cachedCanvas.width = 600; // 初始尺寸
    this.cachedCanvas.height = 600;
    this.cachedCtx = this.cachedCanvas.getContext('2d');
    if (!this.cachedCtx) {
      throw new Error('无法创建缓存Canvas上下文');
    }
    console.log('BoardLayer缓存Canvas创建成功:', { 
      width: this.cachedCanvas.width, 
      height: this.cachedCanvas.height 
    });
  }

  // 更新缓存Canvas尺寸
  updateCacheSize(width: number, height: number): void {
    if (this.cachedCanvas && this.cachedCtx) {
      this.cachedCanvas.width = width;
      this.cachedCanvas.height = height;
      // 重新获取context以确保正确设置
      this.cachedCtx = this.cachedCanvas.getContext('2d');
      this.markDirty();
      console.log('缓存Canvas尺寸更新:', { width, height });
    }
  }

  updateConfig(config: BoardConfig): void {
    this.config = config;
    this.markDirty();
  }

  render(ctx: CanvasRenderingContext2D): void {
    console.log('BoardLayer渲染开始, visible:', this.visible, 'dirty:', this._isDirty);
    if (!this.visible) return;

    // 直接渲染到主Canvas（简化调试）
    console.log('直接渲染到主Canvas...');
    this.renderDirect(ctx);
    
    this._isDirty = false;
    console.log('BoardLayer渲染完成');
  }

  // 直接渲染方法（不使用缓存）
  private renderDirect(ctx: CanvasRenderingContext2D): void {
    console.log('开始直接渲染到主Canvas...');
    
    // 绘制棋盘背景
    console.log('绘制棋盘背景...');
    this.drawBoardBackground(ctx);
    
    // 绘制棋盘格子
    console.log('绘制棋盘格子...');
    this.drawBoardCells(ctx);
    
    // 绘制特殊标记
    console.log('绘制特殊标记...');
    this.drawSpecialMarkers(ctx);
    
    console.log('直接渲染完成');
  }

  // @ts-ignore - 保留以备未来使用
  private renderToCache(): void {
    if (!this.cachedCtx) return;

    console.log('开始渲染到缓存Canvas...');
    
    // 清除缓存Canvas
    this.cachedCtx.clearRect(0, 0, this.cachedCanvas!.width, this.cachedCanvas!.height);

    // 绘制棋盘背景
    console.log('绘制棋盘背景...');
    this.drawBoardBackground(this.cachedCtx);
    
    // 绘制棋盘格子
    console.log('绘制棋盘格子...');
    this.drawBoardCells(this.cachedCtx);
    
    // 绘制特殊标记
    console.log('绘制特殊标记...');
    this.drawSpecialMarkers(this.cachedCtx);
    
    console.log('缓存Canvas渲染完成');
  }

  private drawBoardBackground(_ctx: CanvasRenderingContext2D): void {
    // 不绘制背景，让连接线可见
    // 背景色由CSS或HTML容器提供
  }

  private drawBoardCells(ctx: CanvasRenderingContext2D): void {
    const canvas = ctx.canvas;
    const { 
      scale, 
      scaledCellSize, 
      scaledGap, 
      scaledOffsetX, 
      scaledOffsetY,
      actualBoardWidth,
      actualBoardHeight 
    } = BoardLayer.calculateScaleAndOffset(canvas, this.boardData);

    console.log('绘制棋盘格子参数:', {
      缩放比例: scale,
      实际棋盘尺寸: { actualBoardWidth, actualBoardHeight },
      居中偏移: { scaledOffsetX, scaledOffsetY },
      Canvas尺寸: { width: canvas.width, height: canvas.height }
    });

    let cellCount = 0;
    let visibleCells = 0;
    this.boardData.cells.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        cellCount++;

        // 检查该格子是否应该显示
        if (!this.shouldDrawCell(cell)) {
          return;
        }
        
        visibleCells++;

        const x = scaledOffsetX + colIndex * (scaledCellSize + scaledGap);
        const y = scaledOffsetY + rowIndex * (scaledCellSize + scaledGap);

        // 只记录前几个格子的绘制信息
        if (visibleCells <= 5) {
          console.log(`绘制格子 ${visibleCells}: 类型=${cell.type}, 位置=(${rowIndex},${colIndex}), 坐标=(${x.toFixed(1)},${y.toFixed(1)}), 尺寸=${scaledCellSize.toFixed(1)}`);
        }

        this.drawCell(ctx, cell, x, y, scaledCellSize);
      });
    });
    
    // 调试：统计各种类型的格子数量
    const typeCounts: Record<string, number> = {};
    this.boardData.cells.forEach(row => {
      row.forEach(cell => {
        typeCounts[cell.type] = (typeCounts[cell.type] || 0) + 1;
      });
    });
    
    console.log('格子类型统计:', typeCounts);
    console.log(`总共检查了 ${cellCount} 个格子，绘制了 ${visibleCells} 个可见格子`);
  }

  private drawCell(
    ctx: CanvasRenderingContext2D, 
    cell: any, 
    x: number, 
    y: number, 
    size: number
  ): void {
    const style = this.getCellStyle(cell.type);
    
    // 调试：输出样式信息
    if (Math.random() < 0.01) { // 只打印1%的格子以避免日志过多
      console.log('格子样式:', {
        type: cell.type,
        background: style.background,
        border: style.border,
        坐标: `(${x.toFixed(1)}, ${y.toFixed(1)})`,
        尺寸: size.toFixed(1)
      });
    }
    
    // 设置填充样式 - 统一白色背景
    ctx.fillStyle = style.background;

    // 绘制格子形状
    if (cell.type === 'camp' || cell.type.startsWith('camp-')) {
      // 军营绘制为圆形
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2 - 2, 0, Math.PI * 2);
      ctx.fill();
      
      if (this.config.visibility.showBorders) {
        ctx.strokeStyle = '#d0d0d0';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else {
      // 普通格子绘制为矩形
      ctx.fillRect(x, y, size, size);
      
      if (this.config.visibility.showBorders) {
        ctx.strokeStyle = '#d0d0d0';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
      }
    }
  }

  private shouldDrawCell(cell: any): boolean {
    // 检查该类型的格子是否应该显示
    switch (cell.type) {
      case 'empty':
        return false; // 空格子永远不显示
      case 'normal':
        return this.config.visibility.showCells;
      case 'camp':
      case 'camp-red':
      case 'camp-green':
      case 'camp-blue':
      case 'camp-yellow':
        return this.config.visibility.showCamps;
      case 'player-red':
      case 'player-green':
      case 'player-blue':
      case 'player-yellow':
        return this.config.visibility.showCells; // 玩家区域受showCells控制
      case 'entrance':
      case 'headquarters':
        return this.config.visibility.showEntrances;
      default:
        return true; // 默认显示
    }
  }

  private getCellStyle(_cellType: string): any {
    // 所有单元格使用统一的白色带边框样式
    return {
      background: '#ffffff',
      border: '1px solid #d0d0d0'
    };
  }

  // 已删除未使用的样式解析方法

  // 连接线绘制已移动到ConnectionLayer

  private drawSpecialMarkers(_ctx: CanvasRenderingContext2D): void {
    // 移除入口三角形标识，入口格子与其他格子样式一致
    // 入口信息可以通过其他方式提供（如外部标识或工具提示）
  }

  // 已删除入口三角形绘制方法

  isDirty(): boolean {
    return this._isDirty;
  }

  markDirty(_rect?: Rectangle): void {
    this._isDirty = true;
  }

  clearDirty(): void {
    this._isDirty = false;
  }

  getBounds(): Rectangle {
    return { x: 0, y: 0, width: 600, height: 600 };
  }

  hitTest(_point: Point): Drawable | null {
    // 棋盘层本身不处理点击事件，返回null
    return null;
  }

  dispose(): void {
    this.cachedCanvas = null;
    this.cachedCtx = null;
  }
}