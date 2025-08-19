import { ConfigProvider } from './context/ConfigContext';
import CanvasChessBoard from './components/board/CanvasChessBoard';

function App() {
  return (
    <div className="App">
      <ConfigProvider>
        <CanvasChessBoard />
      </ConfigProvider>
    </div>
  )
}

export default App
