import { ICanvasLayer, Point, Rectangle, Drawable } from '../../types/canvas';
import { BoardData } from '../../types/board';
import { BoardConfig } from '../../config/boardConfig';
import { BoardLayer } from './BoardLayer';

export class ConnectionLayer implements ICanvasLayer {
  readonly name = 'connections';
  readonly zIndex = 0; // 连接线在棋盘格子下方，被格子部分遮挡
  visible = true;

  private boardData: BoardData;
  private config: BoardConfig;
  private _isDirty = true;

  constructor(boardData: BoardData, config: BoardConfig) {
    this.boardData = boardData;
    this.config = config;
  }

  updateData(boardData: BoardData): void {
    this.boardData = boardData;
    this.markDirty();
  }

  updateConfig(config: BoardConfig): void {
    this.config = config;
    this.markDirty();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || !this.config.visibility.showConnections) {
      return;
    }

    if (!this.boardData.connections || this.boardData.connections.length === 0) {
      console.error('❌ 没有连接线数据');
      return;
    }

    this.drawConnections(ctx);
    this._isDirty = false;
  }

  private drawConnections(ctx: CanvasRenderingContext2D): void {
    const canvas = ctx.canvas;
    
    // 使用BoardLayer的共享缩放计算方法
    const { scale, scaledOffsetX, scaledOffsetY } = BoardLayer.calculateScaleAndOffset(canvas, this.boardData);
    
    if (!this.boardData.connections || this.boardData.connections.length === 0) {
      return;
    }
    
    ctx.save();
    ctx.strokeStyle = this.config.connectionStyle.stroke;
    ctx.lineWidth = Math.max(2, this.config.connectionStyle.strokeWidth * scale); // 临时增加线宽以便观察
    ctx.globalAlpha = this.config.connectionStyle.opacity;

    this.boardData.connections.forEach((connection) => {
      const x1 = connection.x1 * scale + scaledOffsetX;
      const y1 = connection.y1 * scale + scaledOffsetY;
      const x2 = connection.x2 * scale + scaledOffsetX;
      const y2 = connection.y2 * scale + scaledOffsetY;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    ctx.restore();
  }


  // ICanvasLayer接口实现
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
    // 连接线不处理点击事件
    return null;
  }
}