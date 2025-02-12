import React from "react";
import "./App.css";
import Canvas from "./components/canvas/Canvas";

const App: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Canvas />
    </div>
  );
};

export default App;
