# Frontend Clean Structure Documentation

This document outlines the clean, organized structure implemented for the Uniswap V4 DeFi frontend application.

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js 15 App Router
│   ├── api/                      # API Routes
│   │   └── pyth/
│   │       └── feeds/
│   │           └── route.ts      # Pyth price feeds API endpoint
│   ├── pyth/                     # Pyth Oracle Dashboard page
│   │   └── page.tsx
│   ├── globals.css               # Global styles with Tailwind
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Homepage
├── components/                   # Reusable React components
│   ├── ui/                       # Base UI components
│   │   ├── button.tsx            # Button component with variants
│   │   └── card.tsx              # Card components (Header, Content, etc.)
│   ├── PriceCard.tsx             # Pyth price display component
│   └── TokenBalance.tsx          # Token balance display component
├── lib/                          # Core business logic and utilities
│   ├── contracts.ts              # Smart contract interactions
│   ├── pyth.ts                   # Pyth Network oracle client
│   └── utils.ts                  # Utility functions and helpers
├── types/                        # TypeScript type definitions
│   └── global.d.ts               # Global type declarations (window.ethereum)
└── package.json                  # Dependencies and scripts
```

## 🏗️ Architecture Overview

### **Separation of Concerns**

1. **`lib/`** - Pure business logic, no UI dependencies
2. **`components/`** - Reusable UI components with clear props interfaces
3. **`app/`** - Page-level components and routing
4. **`types/`** - TypeScript definitions for better type safety

### **Key Libraries & Dependencies**

```json
{
  "dependencies": {
    "react": "19.1.0",
    "react-dom": "19.1.0", 
    "next": "15.5.2",
    "ethers": "^6.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  }
}
```

## 📚 Core Modules

### **1. Pyth Oracle Client (`lib/pyth.ts`)**

```typescript
import { PythClient, getEthPrice, getBtcPrice, PRICE_FEEDS } from "@/lib/pyth";

// Usage examples:
const pythClient = new PythClient();
const ethPrice = await pythClient.getEthPrice(60); // Max 60s old
const btcPrice = await getBtcPrice(); // Convenience function
```

**Features:**
- ✅ Real-time price feeds from Pyth Network
- ✅ Age validation for price freshness
- ✅ Multiple price feed support
- ✅ Error handling and retry logic
- ✅ TypeScript interfaces for type safety

### **2. Contract Interactions (`lib/contracts.ts`)**

```typescript
import { ContractClient, CONTRACT_ADDRESSES } from "@/lib/contracts";

// Usage examples:
const client = new ContractClient();
const balance = await client.getTokenBalance(CONTRACT_ADDRESSES.WETH, userAddress);
const tokenInfo = await client.getTokenInfo(CONTRACT_ADDRESSES.AOT_TOKEN);
```

**Features:**
- ✅ ERC20 token interactions
- ✅ WETH wrapping/unwrapping
- ✅ Balance checking utilities
- ✅ Token approval management
- ✅ Pre-configured contract addresses

### **3. Utility Functions (`lib/utils.ts`)**

```typescript
import { formatCurrency, formatTokenAmount, truncateAddress } from "@/lib/utils";

// Usage examples:
formatCurrency(1234.56); // "$1,234.56"
formatTokenAmount(0.001, "ETH"); // "0.0010 ETH"
truncateAddress("0x1234...5678"); // "0x1234...5678"
```

**Features:**
- ✅ Number formatting (currency, tokens, percentages)
- ✅ Address truncation for UI display
- ✅ Time formatting utilities
- ✅ Input validation helpers
- ✅ Tailwind CSS class merging

## 🎨 UI Components

### **Base Components (`components/ui/`)**

- **Button**: Multiple variants (default, outline, ghost, etc.)
- **Card**: Flexible card layout with header, content, footer
- **Extensible**: Easy to add more shadcn/ui components

### **Feature Components**

- **PriceCard**: Displays Pyth oracle prices with auto-refresh
- **TokenBalance**: Shows token balances with refresh functionality
- **Pre-configured**: WETH and AOT balance components ready to use

## 🔌 API Integration

### **Pyth Feeds API (`app/api/pyth/feeds/route.ts`)**

```typescript
// GET /api/pyth/feeds - Get all configured price feeds
// POST /api/pyth/feeds - Get specific feeds with custom parameters

const response = await fetch('/api/pyth/feeds');
const { success, data, timestamp } = await response.json();
```

**Features:**
- ✅ RESTful API design
- ✅ Error handling with proper HTTP status codes
- ✅ Support for both GET and POST methods
- ✅ Configurable feed selection

## 🚀 Getting Started

### **1. Install Dependencies**

```bash
cd frontend
npm install
```

### **2. Start Development Server**

```bash
npm run dev
```

### **3. Build for Production**

```bash
npm run build
npm start
```

## 🔧 Configuration

### **Environment Variables**

Create `.env.local` for local development:

```env
# Optional: Custom RPC endpoint
NEXT_PUBLIC_SEPOLIA_RPC=https://your-rpc-endpoint.com

# Optional: Custom contract addresses (defaults provided)
NEXT_PUBLIC_POOL_MANAGER=0xE03A1074c86CFeDd5C142C4F04F1a1536e203543
```

### **Contract Addresses (Sepolia)**

All addresses are pre-configured in `lib/contracts.ts`:

- **PoolManager**: `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543`
- **PositionManager**: `0x5de19fE5E05fD56882ACd533cE303def8c5C5705`
- **WETH**: `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14`
- **AOT Token**: `0xD98f9971773045735C62cD8f1a70047f81b9a468`
- **Pyth Oracle**: `0x4305FB66699C3B2702D4d05CF36551390A4c69C6`

## 🎯 Usage Examples

### **Display Live ETH Price**

```tsx
import { PriceCard } from "@/components/PriceCard";
import { PRICE_FEEDS } from "@/lib/pyth";

export function EthPriceDisplay() {
  return (
    <PriceCard
      title="Ethereum"
      symbol="ETH/USD"
      feedId={PRICE_FEEDS.ETH_USD}
    />
  );
}
```

### **Show User Token Balance**

```tsx
import { WETHBalance } from "@/components/TokenBalance";

export function UserDashboard({ userAddress }: { userAddress: string }) {
  return (
    <div>
      <WETHBalance userAddress={userAddress} />
    </div>
  );
}
```

### **Direct Contract Interaction**

```tsx
import { ContractClient } from "@/lib/contracts";
import { ethers } from "ethers";

async function wrapEth(amount: string, signer: ethers.Signer) {
  const client = new ContractClient(undefined, signer);
  const tx = await client.wrapETH(amount);
  await tx.wait();
}
```

## 🔄 Auto-Refresh Features

- **Price Cards**: Auto-refresh every 30 seconds
- **Token Balances**: Manual refresh with loading states
- **Error Handling**: Graceful fallbacks and retry mechanisms

## 📱 Responsive Design

- **Mobile-first**: Tailwind CSS responsive utilities
- **Grid Layouts**: Adaptive card grids for different screen sizes
- **Touch-friendly**: Appropriate button sizes and spacing

## 🛡️ Type Safety

- **Full TypeScript**: End-to-end type safety
- **Contract ABIs**: Typed contract interactions
- **API Responses**: Structured response types
- **Component Props**: Strict prop interfaces

## 🔮 Future Enhancements

- [ ] Add more Pyth price feeds
- [ ] Implement trading interface
- [ ] Add liquidity management UI
- [ ] Real-time WebSocket price updates
- [ ] Transaction history tracking
- [ ] Portfolio analytics dashboard

---

This clean structure provides a solid foundation for building complex DeFi applications with maintainable, scalable code.