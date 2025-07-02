import { createRoot } from "react-dom/client";
import "./main.css";

createRoot(document.getElementById("root")).render(
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
