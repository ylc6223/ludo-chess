import { IDirtyRectManager, Rectangle } from '../../types/canvas';

export class DirtyRectManager implements IDirtyRectManager {
  private dirtyRects: Rectangle[] = [];

  markDirty(rect: Rectangle): void {
    // 检查是否与现有矩形重叠，如果是则合并
    const overlappingIndex = this.dirtyRects.findIndex(existing => 
      this.isOverlapping(rect, existing)
    );

    if (overlappingIndex >= 0) {
      this.dirtyRects[overlappingIndex] = this.mergeRects(
        this.dirtyRects[overlappingIndex], 
        rect
      );
    } else {
      this.dirtyRects.push(rect);
    }
  }

  getDirtyRects(): Rectangle[] {
    return [...this.dirtyRects];
  }

  clear(): void {
    this.dirtyRects = [];
  }

  merge(): Rectangle[] {
    if (this.dirtyRects.length === 0) {
      return [];
    }

    // 简单实现：合并相邻的矩形
    const merged: Rectangle[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < this.dirtyRects.length; i++) {
      if (processed.has(i)) continue;

      let currentRect = { ...this.dirtyRects[i] };
      processed.add(i);

      // 查找可以合并的矩形
      for (let j = i + 1; j < this.dirtyRects.length; j++) {
        if (processed.has(j)) continue;

        const otherRect = this.dirtyRects[j];
        if (this.canMerge(currentRect, otherRect)) {
          currentRect = this.mergeRects(currentRect, otherRect);
          processed.add(j);
        }
      }

      merged.push(currentRect);
    }

    return merged;
  }

  private isOverlapping(rect1: Rectangle, rect2: Rectangle): boolean {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y
    );
  }

  private canMerge(rect1: Rectangle, rect2: Rectangle): boolean {
    // 检查矩形是否相邻或重叠，且合并后的面积不会过大
    const merged = this.mergeRects(rect1, rect2);
    const originalArea = (rect1.width * rect1.height) + (rect2.width * rect2.height);
    const mergedArea = merged.width * merged.height;
    
    // 如果合并后的面积没有显著增加，则可以合并
    return mergedArea <= originalArea * 1.5;
  }

  private mergeRects(rect1: Rectangle, rect2: Rectangle): Rectangle {
    const x = Math.min(rect1.x, rect2.x);
    const y = Math.min(rect1.y, rect2.y);
    const right = Math.max(rect1.x + rect1.width, rect2.x + rect2.width);
    const bottom = Math.max(rect1.y + rect1.height, rect2.y + rect2.height);

    return {
      x,
      y,
      width: right - x,
      height: bottom - y
    };
  }
}