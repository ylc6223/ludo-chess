import React, { useRef, useEffect, useState } from 'react';
import { useConfig } from '../../context/ConfigContext';
import { CanvasEngine } from '../../canvas/core/CanvasEngine';
import { BoardLayer } from '../../canvas/layers/BoardLayer';
import { ConnectionLayer } from '../../canvas/layers/ConnectionLayer';
import { PieceLayer } from '../../canvas/layers/PieceLayer';
import DrawerToolbar from '../ui/DrawerToolbar';

const CanvasChessBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const boardLayerRef = useRef<BoardLayer | null>(null);
  const connectionLayerRef = useRef<ConnectionLayer | null>(null);
  const pieceLayerRef = useRef<PieceLayer | null>(null);
  
  const [performanceInfo, setPerformanceInfo] = useState<any>(null);
  const [canvasSize, setCanvasSize] = useState(1000);
  
  const { config } = useConfig();

  // 暴露调试接口到全局
  useEffect(() => {
    (window as any).canvasDebug = {
      canvas: canvasRef.current,
      engine: engineRef.current,
      boardLayer: boardLayerRef.current,
      connectionLayer: connectionLayerRef.current,
      pieceLayer: pieceLayerRef.current,
      forceRender: () => {
        if (engineRef.current) {
          console.log('强制重新渲染...');
          engineRef.current.render();
        }
      },
      // 连接线专用调试方法
      debugConnections: () => {
        const connectionLayer = connectionLayerRef.current;
        if (connectionLayer) {
          console.log('=== 连接线调试信息 ===');
          console.log('ConnectionLayer 可见性:', connectionLayer.visible);
          console.log('ConnectionLayer zIndex:', connectionLayer.zIndex);
          console.log('连接线数据:', (connectionLayer as any).boardData?.connections);
          console.log('配置显示连接线:', config.visibility?.showConnections);
          console.log('连接线样式:', config.connectionStyle);
        }
      },
      // 强制绘制测试连接线
      drawTestLine: () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.moveTo(100, 100);
            ctx.lineTo(500, 500);
            ctx.stroke();
            console.log('✅ 测试红线已绘制: (100,100) -> (500,500)');
          }
        }
      }
    };
  });

  // 初始化Canvas引擎
  useEffect(() => {
    if (!canvasRef.current) return;

    console.log('🚀 开始初始化Canvas引擎...');
    console.log('Canvas元素信息:', {
      canvas: canvasRef.current,
      width: canvasRef.current.width,
      height: canvasRef.current.height,
      clientWidth: canvasRef.current.clientWidth,
      clientHeight: canvasRef.current.clientHeight
    });

    try {
      // 确保Canvas尺寸设置正确
      const canvas = canvasRef.current;
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      console.log('Canvas尺寸设置:', { width: canvas.width, height: canvas.height });

      // 创建Canvas引擎 - 完全禁用优化确保稳定渲染
      const engine = new CanvasEngine(canvas, {
        enableDirtyRectOptimization: false, // 禁用脏矩形优化
        enableObjectPooling: false, // 禁用对象池
        maxFPS: 30, // 降低帧率减少日志
        debugMode: false // 关闭调试模式减少日志
      });

      console.log('✅ Canvas引擎创建成功');

      // 创建渲染层(只保留UI渲染)
      const boardLayer = new BoardLayer(config);
      console.log('✅ BoardLayer创建成功');
      
      // 获取棋盘数据用于连接线层和棋子层
      const boardData = (boardLayer as any).boardData;
      const connectionLayer = new ConnectionLayer(boardData, config);
      console.log('✅ ConnectionLayer创建成功');

      // 创建棋子层
      const pieceLayer = new PieceLayer(boardData, config);
      console.log('✅ PieceLayer创建成功');

      // 按z-index顺序添加渲染层（低到高）
      engine.addLayer(connectionLayer); // 连接线 (zIndex: 0) - 最底层
      engine.addLayer(boardLayer); // 棋盘背景和格子 (zIndex: 1) - 在连接线上方
      engine.addLayer(pieceLayer); // 棋子 (zIndex: 2) - 最上层
      console.log('✅ 渲染层添加完成，层级：连接线(0) < 棋盘(1) < 棋子(2)');

      // 保存引用
      engineRef.current = engine;
      boardLayerRef.current = boardLayer;
      connectionLayerRef.current = connectionLayer;
      pieceLayerRef.current = pieceLayer;

      // 测试直接Canvas绘制 - 使用不同颜色确保可见性
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制测试图案
        ctx.fillStyle = 'red';
        ctx.fillRect(10, 10, 50, 50);
        ctx.fillStyle = 'blue';
        ctx.fillRect(70, 10, 50, 50);
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(50, 100, 25, 0, Math.PI * 2);
        ctx.fill();
        console.log('✅ 直接Canvas测试绘制完成 - 红蓝方块和绿圆');
      }

      // 延迟首次渲染确保所有组件就绪
      setTimeout(() => {
        console.log('🎨 开始首次渲染...');
        engine.render();
        console.log('✅ 首次渲染完成');
      }, 100);

      // 启动性能监控
      const perfInterval = setInterval(() => {
        setPerformanceInfo(engine.getPerformanceInfo());
      }, 1000);

      return () => {
        clearInterval(perfInterval);
        engine.dispose();
      };
    } catch (error) {
      console.error('❌ Canvas引擎初始化失败:', error);
    }
  }, [canvasSize, config]); // 添加canvasSize和config依赖

  // 配置更新
  useEffect(() => {
    if (boardLayerRef.current) {
      boardLayerRef.current.updateConfig(config);
    }
    if (connectionLayerRef.current) {
      connectionLayerRef.current.updateConfig(config);
    }
    if (pieceLayerRef.current) {
      pieceLayerRef.current.updateConfig(config);
    }
  }, [config]);

  // Canvas尺寸变化时更新渲染层
  useEffect(() => {
    if (boardLayerRef.current && canvasRef.current) {
      // 更新BoardLayer缓存Canvas尺寸
      (boardLayerRef.current as any).updateCacheSize?.(canvasSize, canvasSize);
      
      // 强制重新渲染
      if (engineRef.current) {
        boardLayerRef.current.markDirty();
        connectionLayerRef.current?.markDirty();
        pieceLayerRef.current?.markDirty();
        engineRef.current.render();
        console.log('Canvas尺寸变化，重新渲染完成:', canvasSize);
      }
    }
  }, [canvasSize]);

  // 移除所有游戏事件处理逻辑

  const handleResize = () => {
    if (engineRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      if (container) {
        // 计算容器尺寸，保持正方形
        const containerRect = container.getBoundingClientRect();
        const size = Math.min(containerRect.width - 40, containerRect.height - 40, 800); // 减去padding，最大800px
        
        // 更新Canvas内部和显示尺寸
        canvas.width = size;
        canvas.height = size;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        
        // 强制重新渲染
        if (boardLayerRef.current) {
          boardLayerRef.current.markDirty();
        }
        if (connectionLayerRef.current) {
          connectionLayerRef.current.markDirty();
        }
        if (pieceLayerRef.current) {
          pieceLayerRef.current.markDirty();
        }
        engineRef.current.render();
        
        console.log('Canvas尺寸调整:', { 
          containerWidth: containerRect.width, 
          containerHeight: containerRect.height, 
          canvasSize: size 
        });
      }
    }
  };

  // 窗口大小变化监听和初始调整
  useEffect(() => {
    // 初始调整尺寸
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <div className="h-full flex flex-col items-center justify-center p-2">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">四国军棋棋盘演示</h1>
        
        {/* Canvas容器 */}
        <div className="relative border border-gray-300 bg-white rounded-lg shadow-lg mt-2">
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            style={{ 
              display: 'block',
              width: `min(70vw, ${canvasSize}px)`,
              height: `min(70vw, ${canvasSize}px)`, 
              maxWidth: `${canvasSize}px`,
              maxHeight: `${canvasSize}px`,
              cursor: 'pointer'
            }}
            className="rounded-lg"
          />
          
        </div>
        
        {/* 简化图例 */}
        <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs max-w-lg">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500"></div>
            <span>红方</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500"></div>
            <span>绿方</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500"></div>
            <span>蓝方</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-400"></div>
            <span>黄方</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
            <span>军营</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 border border-gray-400 bg-white"></div>
            <span>入口</span>
          </div>
        </div>
      </div>

      <DrawerToolbar 
        canvasSize={canvasSize} 
        onCanvasSizeChange={setCanvasSize} 
      />
      {/* 性能信息 - 右上角 */}
      {performanceInfo && (
        <div className="fixed top-4 right-16 bg-black bg-opacity-70 text-white text-xs p-2 rounded z-30">
          <div>FPS: {performanceInfo.fps}</div>
          <div>渲染时间: {performanceInfo.renderTime}ms</div>
          <div>内存: {performanceInfo.memoryUsage}MB</div>
          <div>绘制调用: {performanceInfo.drawCalls}</div>
        </div>
      )}
    </div>
  );
};

export default CanvasChessBoard;