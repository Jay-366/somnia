'use client';

import { ThirdwebProvider } from "thirdweb/react";
import { SwapHistoryTracker } from "./SwapHistoryTracker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <SwapHistoryTracker>
        {children}
      </SwapHistoryTracker>
    </ThirdwebProvider>
  );
}
