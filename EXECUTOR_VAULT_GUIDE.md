# ExecutorVault Smart Contract Guide

## Overview

The **ExecutorVault** is a smart contract deployed on Sepolia testnet that enables:

- ✅ **AOT → WETH swaps** via Uniswap V4 pool
- ✅ **Balance tracking** for user funds stored in vault
- ✅ **Token withdrawals** with WETH → ETH unwrapping option
- ✅ **Frontend integration** for seamless user experience

## Architecture

```
User → ExecutorVault → Uniswap V4 Pool (AOT/WETH)
                   ↓
               Store WETH in vault
                   ↓
            Track user balances
                   ↓
          Allow withdrawals (WETH or ETH)
```

## Contract Features

### Core Functions

1. **`executeSwap(uint256 aotAmountIn)`**
   - Swaps AOT → WETH via Uniswap V4
   - Stores received WETH in vault under user's balance
   - Emits `SwapExecuted` event

2. **`withdraw(address token, uint256 amount, bool unwrap)`**
   - Withdraws tokens from user's vault balance
   - If `unwrap = true` and token is WETH, converts to ETH
   - Emits `Withdrawal` event

3. **`deposit(address token, uint256 amount)`**
   - Manual deposit of WETH or AOT to vault
   - Updates user balance mapping
   - Emits `Deposit` event

### View Functions

- `getUserBalance(user, token)` - Get specific token balance
- `getUserBalances(user)` - Get both WETH and AOT balances
- `getTotalBalances()` - Get total vault balances
- `getContractBalances()` - Get actual contract token balances
- `getPoolInfo()` - Get Uniswap V4 pool configuration

## Deployment Instructions

### Prerequisites

1. **Environment Setup**
```bash
# Add to .env file
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC=https://rpc.sepolia.org
```

2. **Verify Existing Contracts**
```bash
# Check that the pool exists and has liquidity
cast call 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543 "getPoolId((address,address,uint24,int24,address))" \
  "(0xD98f9971773045735C62cD8f1a70047f81b9a468,0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14,3000,60,0x0000000000000000000000000000000000000000)" \
  --rpc-url sepolia
```

### Deploy ExecutorVault

```bash
# Deploy to Sepolia
forge script script/DeployExecutorVault.s.sol --rpc-url sepolia --broadcast -vvv

# Expected output:
# ExecutorVault Address: 0x[NEW_VAULT_ADDRESS]
```

### Update Environment Variables

```bash
# Add vault address to .env
NEXT_PUBLIC_EXECUTOR_VAULT_ADDRESS=0x[NEW_VAULT_ADDRESS]
```

### Verify Deployment

```bash
# Test vault info
cast call $NEXT_PUBLIC_EXECUTOR_VAULT_ADDRESS "getPoolInfo()" --rpc-url sepolia

# Test constants
cast call $NEXT_PUBLIC_EXECUTOR_VAULT_ADDRESS "WETH()" --rpc-url sepolia
cast call $NEXT_PUBLIC_EXECUTOR_VAULT_ADDRESS "AOT()" --rpc-url sepolia
```

## Testing

### Run Contract Tests

```bash
# Run all ExecutorVault tests
forge test --match-contract ExecutorVaultTest -vvv

# Run specific test
forge test --match-test test_DirectDeposit -vvv

# Test with Sepolia fork
forge test --match-contract ExecutorVaultTest --fork-url sepolia -vvv
```

### Manual Testing

```bash
# 1. Get some AOT tokens (if needed)
cast send 0xD98f9971773045735C62cD8f1a70047f81b9a468 "transfer(address,uint256)" \
  $YOUR_ADDRESS 100000000000000000000 \
  --rpc-url sepolia --private-key $PRIVATE_KEY

# 2. Approve vault to spend AOT
cast send 0xD98f9971773045735C62cD8f1a70047f81b9a468 "approve(address,uint256)" \
  $NEXT_PUBLIC_EXECUTOR_VAULT_ADDRESS 115792089237316195423570985008687907853269984665640564039457584007913129639935 \
  --rpc-url sepolia --private-key $PRIVATE_KEY

# 3. Execute a swap (1 AOT)
cast send $NEXT_PUBLIC_EXECUTOR_VAULT_ADDRESS "executeSwap(uint256)" \
  1000000000000000000 \
  --rpc-url sepolia --private-key $PRIVATE_KEY

# 4. Check your vault balance
cast call $NEXT_PUBLIC_EXECUTOR_VAULT_ADDRESS "getUserBalances(address)" \
  $YOUR_ADDRESS --rpc-url sepolia

# 5. Withdraw WETH as ETH
cast send $NEXT_PUBLIC_EXECUTOR_VAULT_ADDRESS "withdraw(address,uint256,bool)" \
  0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14 500000000000000000 true \
  --rpc-url sepolia --private-key $PRIVATE_KEY
```

## Frontend Integration

### 1. Update Contract Address

```typescript
// frontend/lib/contracts.ts
export const CONTRACT_ADDRESSES = {
  // ... existing addresses
  EXECUTOR_VAULT: "0x[YOUR_DEPLOYED_VAULT_ADDRESS]",
} as const;
```

### 2. Use ExecutorVaultPanel Component

```tsx
// In your React component
import { ExecutorVaultPanel } from '@/components/ExecutorVaultPanel';

export default function VaultPage() {
  return (
    <div className="container mx-auto p-6">
      <ExecutorVaultPanel />
    </div>
  );
}
```

### 3. User Workflow

1. **Connect Wallet** - User connects wallet to see vault balances
2. **Check Balances** - View WETH and AOT balances in vault
3. **Execute Swap** - Swap AOT → WETH (requires AOT approval)
4. **Withdraw Funds** - Withdraw WETH or convert to ETH

## Contract Addresses (Sepolia)

```typescript
const SEPOLIA_CONTRACTS = {
  POOL_MANAGER: "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543",
  WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", 
  AOT_TOKEN: "0xD98f9971773045735C62cD8f1a70047f81b9a468",
  EXECUTOR_VAULT: "0x[TO_BE_DEPLOYED]", // Your deployed address
};
```

## Pool Configuration

- **Pool Pair**: AOT/WETH
- **Fee Tier**: 0.30% (3000)
- **Tick Spacing**: 60
- **Hooks**: None (address(0))

## Security Features

- ✅ **ReentrancyGuard** - Prevents reentrancy attacks
- ✅ **Ownable** - Admin functions restricted to owner
- ✅ **SafeERC20** - Safe token transfers
- ✅ **Balance Tracking** - Internal accounting matches actual balances
- ✅ **Emergency Functions** - Owner can emergency withdraw if needed

## Error Handling

### Common Errors

1. **"ExecutorVault: Amount must be greater than 0"**
   - Solution: Enter a positive amount

2. **"ExecutorVault: Insufficient balance"**
   - Solution: Check your vault balance before withdrawing

3. **"ERC20: transfer amount exceeds allowance"**
   - Solution: Approve the vault to spend your AOT tokens

4. **"Swap failed - no WETH received"**
   - Solution: Check if pool has liquidity or increase slippage tolerance

### Troubleshooting

```bash
# Check your AOT balance
cast call 0xD98f9971773045735C62cD8f1a70047f81b9a468 "balanceOf(address)" $YOUR_ADDRESS --rpc-url sepolia

# Check AOT allowance for vault
cast call 0xD98f9971773045735C62cD8f1a70047f81b9a468 "allowance(address,address)" \
  $YOUR_ADDRESS $NEXT_PUBLIC_EXECUTOR_VAULT_ADDRESS --rpc-url sepolia

# Check vault's WETH balance
cast call 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14 "balanceOf(address)" \
  $NEXT_PUBLIC_EXECUTOR_VAULT_ADDRESS --rpc-url sepolia
```

## Gas Optimization

The contract is optimized for gas efficiency:

- Uses packed structs where possible
- Batches multiple operations
- Minimal external calls
- Efficient storage patterns

## Future Enhancements

Potential improvements:

1. **Multi-pair Support** - Support more token pairs
2. **Slippage Protection** - Add configurable slippage limits
3. **Batch Operations** - Allow multiple swaps in one transaction
4. **Yield Integration** - Stake idle WETH for yield
5. **Price Oracle** - Integration with Pyth for better pricing

## Support

For issues or questions:

1. Check the test results: `forge test --match-contract ExecutorVaultTest`
2. Verify contract state on [Sepolia Etherscan](https://sepolia.etherscan.io)
3. Review transaction logs for detailed error messages

---

## Ready to Deploy! 🚀

Your ExecutorVault is ready for deployment to Sepolia. Run the deployment command and update the frontend configuration with the new contract address.

```bash
forge script script/DeployExecutorVault.s.sol --rpc-url sepolia --broadcast -vvv
```