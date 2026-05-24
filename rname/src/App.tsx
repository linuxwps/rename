import { FileDropZone } from "./components/FileDropZone";
import "./App.css";

function App() {
  return (
    <div className="app">
      <div className="left-panel">
        <FileDropZone />
      </div>
      <div className="right-panel">
        <div className="placeholder">
          <p>rename options will appear here</p>
        </div>
      </div>
    </div>
  );
}

export default App;