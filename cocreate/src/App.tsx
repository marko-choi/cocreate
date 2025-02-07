import React from "react";
import "./App.css";
import Canvas from "./components/canvas/Canvas";
// import Annotation from "./components/annotation/Annotation";

const App: React.FC = () => {
  return (
    <div>
      {/* <h3 style={{ color: 'white' }}>CoCreate</h3> */}
      <Canvas />
      {/* <div>test</div> */}
      {/* <Annotation /> */}
    </div>
  );
};

export default App;
