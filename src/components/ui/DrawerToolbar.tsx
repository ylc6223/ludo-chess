import React, { useState } from 'react';
import { Settings, ChevronRight } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

interface DrawerToolbarProps {
  canvasSize?: number;
  onCanvasSizeChange?: (size: number) => void;
}

const DrawerToolbar: React.FC<DrawerToolbarProps> = ({ 
  canvasSize = 800,
  onCanvasSizeChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { config, updateVisibility, updateConnectionStyle, resetToDefault } = useConfig();

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const handleVisibilityChange = (key: keyof typeof config.visibility) => {
    updateVisibility(key);
  };

  const handleConnectionStyleChange = (key: keyof typeof config.connectionStyle, value: any) => {
    updateConnectionStyle(key, value);
  };

  return (
    <>
      {/* 浮动按钮 */}
      <button
        onClick={toggleDrawer}
        className={`fixed top-4 right-4 z-50 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-0'
        }`}
        title="打开设置面板"
      >
        <Settings size={20} />
      </button>

      {/* 抽屉遮罩 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleDrawer}
        />
      )}

      {/* 抽屉面板 */}
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '320px' }}
      >
        {/* 抽屉头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">棋盘显示设置</h3>
          <button
            onClick={toggleDrawer}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 抽屉内容 */}
        <div className="flex flex-col h-full overflow-y-auto pb-20">
          <div className="p-4 space-y-6">
            
            {/* Canvas 尺寸设置 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Canvas 尺寸</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">画布大小</label>
                  <input
                    type="range"
                    min="300"
                    max="1000"
                    step="50"
                    value={canvasSize}
                    onChange={(e) => onCanvasSizeChange?.(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">
                    {canvasSize} × {canvasSize} 像素
                  </div>
                </div>
                
                {/* 预设尺寸快速选择 */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[300, 500, 600, 800].map((size) => (
                    <button
                      key={size}
                      onClick={() => onCanvasSizeChange?.(size)}
                      className={`py-2 px-3 text-xs rounded border transition-colors ${
                        canvasSize === size 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 可见性设置 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">显示设置</h4>
              <div className="space-y-2">
                {[
                  { key: 'showBorders', label: '显示边框' },
                  { key: 'showConnections', label: '显示连接线' },
                  { key: 'showEntrances', label: '显示入口标记' },
                  { key: 'showCoordinates', label: '显示坐标' },
                  { key: 'showPieces', label: '显示棋子' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={config.visibility[item.key as keyof typeof config.visibility]}
                      onChange={() => handleVisibilityChange(item.key as keyof typeof config.visibility)}
                      className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>
            </div>


            {/* 玩家颜色配置 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">玩家颜色</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'red', label: '红方', color: '#E53935' },
                  { key: 'green', label: '绿方', color: '#43A047' },
                  { key: 'blue', label: '蓝方', color: '#1E88E5' },
                  { key: 'yellow', label: '黄方', color: '#FDD835' }
                ].map((player) => (
                  <div key={player.key} className="text-center">
                    <div 
                      className="w-8 h-8 mx-auto mb-1 rounded border border-gray-300"
                      style={{ backgroundColor: player.color }}
                    ></div>
                    <span className="text-xs text-gray-600">{player.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 连接线样式 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">连接线设置</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">线宽</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={config.connectionStyle?.strokeWidth || 2}
                    onChange={(e) => handleConnectionStyleChange('strokeWidth', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">
                    {config.connectionStyle?.strokeWidth || 2}px
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">透明度</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={(config.connectionStyle?.opacity || 0.8) * 100}
                    onChange={(e) => handleConnectionStyleChange('opacity', parseInt(e.target.value) / 100)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">
                    {Math.round((config.connectionStyle?.opacity || 0.8) * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* 重置按钮 */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={resetToDefault}
                className="w-full py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                重置为默认设置
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DrawerToolbar;