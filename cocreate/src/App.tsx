import React from "react";
import "./App.css";
import Canvas from "./components/canvas/Canvas";

/**
 * The instanceId is the id of the question in Qualtrics.
 * It is used to identify the question and the data associated with it.
 * Sample instanceId: "QID1"
 */
export type InstanceId = string;

export interface AppProps {
  instanceId?: InstanceId;
}

const App: React.FC<AppProps> = (props) => {
  const { instanceId } = props;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
      }}
    >
      <Canvas instanceId={instanceId} />
    </div>
  );
};

export default App;
