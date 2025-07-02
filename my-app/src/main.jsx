import { createRoot } from "react-dom/client";
import "./main.css";
import { useState } from "react";

function App() {
  const [value, setValue] = useState("");
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

createRoot(document.getElementById("root")).render(<App />);
