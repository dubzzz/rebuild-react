import { createRoot } from "react-dom/client";
import "./main.css";

function App() {
  return (
    <div>
      <div>
        Hello{" "}
        <span>
          <i>Enter your name</i>
        </span>
      </div>
      <input
        value=""
        placeholder="Your name"
        onKeyDown={(event) => console.log(event)}
      />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
