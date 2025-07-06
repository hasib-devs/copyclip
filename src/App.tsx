import "@/assets/css/style.css";
import "@radix-ui/themes/styles.css";

import DefaultLayout from "@/components/layouts/Default";
import { Box, Theme } from "@radix-ui/themes";
import { useVimMotion } from "./hooks/useVimMotion";

function App() {
  useVimMotion();

  return (
    <Theme accentColor="teal" hasBackground className="bg-zinc-50">
      <Box>
        <DefaultLayout />
      </Box>
    </Theme>
  );
}

export default App;
