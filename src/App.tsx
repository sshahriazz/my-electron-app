import React from "react";

const App: React.FC = () => {
  const [count, setCount] = React.useState(0);
  return (
    <div>
      <h1>{count}</h1>
      <button onClick={() => setCount(count + 1)}>Count</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <h1>💖 Hello World!</h1>
      <p>Welcome to your Electron + React application.</p>
    </div>
  );
};

export default App;
