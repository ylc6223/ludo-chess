import React, { memo } from 'react';
import { Connection } from '../../types/board';
import { BoardConfig } from '../../config/boardConfig';

interface BoardConnectionsProps {
  connections: Connection[];
  config: BoardConfig;
  width?: number;
  height?: number;
}

const BoardConnections: React.FC<BoardConnectionsProps> = memo(({ 
  connections, 
  config, 
  width = 1000, 
  height = 1000 
}) => {
  if (!config.visibility.showConnections) {
    return null;
  }

  return (
    <svg 
      className="absolute top-0 left-0 pointer-events-none"
      width={width}
      height={height}
      style={{ transform: 'translate(20px, 20px)' }}
    >
      {connections.map((connection) => (
        <line
          key={connection.key}
          x1={connection.x1}
          y1={connection.y1}
          x2={connection.x2}
          y2={connection.y2}
          stroke={connection.stroke || config.connectionStyle.stroke}
          strokeWidth={config.connectionStyle.strokeWidth}
          opacity={config.connectionStyle.opacity}
        />
      ))}
    </svg>
  );
});

BoardConnections.displayName = 'BoardConnections';

export default BoardConnections;