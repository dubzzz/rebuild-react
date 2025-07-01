import { useState } from "react";
import "./App.css";

function App() {
  const [value, setValue] = useState("abc");
  return (
    <div>
      <div>
        Hello <span>{value || <i>Enter your name</i>}</span>
      </div>
      <input
        value={value}
        placeholder="Your name"
        onKeyDown={(event) => setValue(event.target.value + event.key)}
      />
    </div>
  );
}

export default App;
