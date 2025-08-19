# 可见性控制修复记录

## 修复日期
2025年8月7日 18:00

## 问题描述
在四国军棋棋盘组件中，当用户取消勾选"显示军营"和"显示大本营入口"选项时，对应元素的背景色仍然显示，没有变为透明。

## 问题分析

### 根本原因
1. **CSS优先级问题**：在 `src/index.css` 文件中，`.chess-cell.camp` 和 `.chess-cell.entrance` 使用了 `!important` 声明强制设置背景色，覆盖了JavaScript设置的内联样式。

2. **配置不一致**：代码中引用了 `config.visibility.showHeadquarters` 属性，但配置文件中没有定义该属性。

3. **选项冗余**：发现"显示大本营"和"显示大本营入口"实际上表达的是同一个意思，因为棋盘上只有 `entrance` 类型的格子，没有实际的 `headquarters` 类型格子。

## 修复方案

### 1. CSS样式修复
**文件**: `src/index.css`

**修改前**:
```css
.chess-cell.camp {
  background: #F8F8F8 !important;
}

.chess-cell.entrance {
  background: #F8F8F8 !important;
}
```

**修改后**:
```css
.chess-cell.camp {
  background: #F8F8F8;
}

.chess-cell.camp.hidden {
  background: transparent !important;
  color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.chess-cell.entrance {
  background: #F8F8F8;
}

.chess-cell.entrance.hidden {
  background: transparent !important;
  color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.chess-cell.entrance.hidden::after {
  display: none;
}
```

### 2. JavaScript逻辑修复
**文件**: `src/components/ChessBoard.tsx`

**修改 `getCellClassName` 函数**:
```typescript
const getCellClassName = (cell: Cell): string => {
  // ... 其他代码
  
  switch (cell.type) {
    case 'camp':
      className += ' camp';
      // 根据可见性设置添加hidden类
      if (!config.visibility.showCamps) {
        className += ' hidden';
      }
      break;
    case 'entrance':
      className += ' entrance';
      // 根据可见性设置添加hidden类
      if (!config.visibility.showEntrances) {
        className += ' hidden';
      }
      break;
    // ... 其他case
  }
  
  return className;
};
```

### 3. 配置文件清理
**文件**: `src/config/boardConfig.ts`

**移除多余的配置项**:
```typescript
// 修改前
visibility: {
  showCells: boolean;
  showCamps: boolean;
  showEntrances: boolean;
  showHeadquarters: boolean; // 移除这个多余的配置
  showBorders: boolean;
}

// 修改后
visibility: {
  showCells: boolean;
  showCamps: boolean;
  showEntrances: boolean; // 重命名为"显示大本营"
  showBorders: boolean;
}
```

### 4. 工具栏界面优化
**文件**: `src/components/Toolbar.tsx`

**简化可见性选项**:
- 移除了"显示大本营"选项（多余）
- 将"显示大本营入口"重命名为"显示大本营"

## 修复结果

### 功能验证
现在当用户取消勾选以下选项时，对应元素将完全隐藏：

1. **显示军营**：
   - 军营的背景色变为透明
   - 边框和阴影隐藏
   - 圆形形状保持但完全透明

2. **显示大本营**：
   - 大本营入口的背景色变为透明
   - 边框和阴影隐藏
   - 三角形图标隐藏

### 最终可见性选项
- ✅ **显示单元格**：控制普通单元格的可见性
- ✅ **显示军营**：控制军营（圆形）的可见性
- ✅ **显示大本营**：控制大本营入口（三角形）的可见性
- ✅ **显示边框**：控制所有边框的可见性

## 技术要点

### CSS优先级处理
使用了分层的CSS类控制方案：
1. 基础样式：`.chess-cell.camp`
2. 隐藏状态：`.chess-cell.camp.hidden`（使用 `!important` 确保优先级）

### 动态类名控制
通过JavaScript动态添加/移除 `hidden` 类名，而不是仅依赖内联样式，确保了更好的控制力。

### 伪元素处理
对于使用 `::after` 伪元素显示的图标（如三角形），通过 `display: none` 来完全隐藏。

## 相关文件清单

### 修改的文件
1. `src/index.css` - CSS样式修复
2. `src/components/ChessBoard.tsx` - 逻辑修复和代码清理
3. `src/config/boardConfig.ts` - 配置清理
4. `src/components/Toolbar.tsx` - 界面优化

### 测试验证
- [x] 取消勾选"显示军营"，军营背景色变为透明
- [x] 取消勾选"显示大本营"，大本营入口背景色和图标隐藏
- [x] 重新勾选选项，元素正常显示
- [x] 其他可见性选项正常工作

## 经验总结

1. **CSS优先级问题**：在使用JavaScript动态控制样式时，要注意CSS中的 `!important` 声明可能会覆盖内联样式。

2. **配置一致性**：确保代码中引用的配置项在配置文件中都有对应的定义。

3. **功能重复检查**：定期检查是否存在功能重复或冗余的配置选项。

4. **CSS类名方案**：对于复杂的样式控制，使用CSS类名比内联样式更可靠和可维护。

## 后续优化建议

1. 考虑使用CSS变量来统一管理颜色和样式
2. 添加过渡动画，让显示/隐藏更加平滑
3. 考虑将可见性控制抽象为一个通用的Hook或工具函数