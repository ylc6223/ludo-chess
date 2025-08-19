import { PerformanceInfo } from '../../types/canvas';

export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private renderTimes: number[] = [];
  private maxSamples = 60; // 保留最近60帧的数据
  private lastFrameTime = 0;
  private drawCallCount = 0;
  private dirtyRegionCount = 0;

  recordFrame(currentTime: number): void {
    if (this.lastFrameTime > 0) {
      const frameTime = currentTime - this.lastFrameTime;
      this.frameTimes.push(frameTime);
      
      if (this.frameTimes.length > this.maxSamples) {
        this.frameTimes.shift();
      }
    }
    this.lastFrameTime = currentTime;
  }

  recordRenderTime(renderTime: number): void {
    this.renderTimes.push(renderTime);
    
    if (this.renderTimes.length > this.maxSamples) {
      this.renderTimes.shift();
    }
  }

  recordDrawCall(): void {
    this.drawCallCount++;
  }

  recordDirtyRegion(): void {
    this.dirtyRegionCount++;
  }

  getInfo(): PerformanceInfo {
    const averageFrameTime = this.frameTimes.length > 0 
      ? this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length 
      : 0;

    const fps = averageFrameTime > 0 ? 1000 / averageFrameTime : 0;

    const averageRenderTime = this.renderTimes.length > 0
      ? this.renderTimes.reduce((sum, time) => sum + time, 0) / this.renderTimes.length
      : 0;

    // 估算内存使用（简单实现）
    const memoryUsage = this.estimateMemoryUsage();

    return {
      fps: Math.round(fps * 10) / 10,
      renderTime: Math.round(averageRenderTime * 100) / 100,
      memoryUsage,
      drawCalls: this.drawCallCount,
      dirtyRegions: this.dirtyRegionCount
    };
  }

  private estimateMemoryUsage(): number {
    // 简单的内存使用估算
    // 实际项目中可以使用 performance.memory API（如果可用）
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100; // MB
    }
    
    // fallback: 根据对象数量估算
    return Math.round((this.drawCallCount * 0.001 + this.dirtyRegionCount * 0.002) * 100) / 100;
  }

  reset(): void {
    this.drawCallCount = 0;
    this.dirtyRegionCount = 0;
  }

  // 获取详细的性能统计信息（用于调试）
  getDetailedStats() {
    return {
      frameTimes: [...this.frameTimes],
      renderTimes: [...this.renderTimes],
      minFrameTime: Math.min(...this.frameTimes),
      maxFrameTime: Math.max(...this.frameTimes),
      minRenderTime: Math.min(...this.renderTimes),
      maxRenderTime: Math.max(...this.renderTimes)
    };
  }
}