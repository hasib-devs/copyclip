import App from "@/App";
import ReactDOM from "react-dom/client";
import { DatabaseProvider } from "./contexts/database-context";
import { ClipboardProvider } from "@/contexts/clipboard-context";
// import { StrictMode } from "react";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // <StrictMode>
  <DatabaseProvider>
    <ClipboardProvider>
      <App />
    </ClipboardProvider>
  </DatabaseProvider>
  // </StrictMode>,
);
