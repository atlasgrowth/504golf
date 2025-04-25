import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.title = "SwingEats - Golf Facility Food Ordering System";

createRoot(document.getElementById("root")!).render(<App />);
