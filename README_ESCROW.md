# Escrow Contract System

## Overview
A minimal, trusted relayer escrow contract for STT tokens that enables secure swap execution with verified returns.

## Architecture

### Core Components
- **contracts/Escrow.sol** - Main escrow contract with deposit, execution marking, and withdrawal
- **test/Escrow.t.sol** - Comprehensive test suite covering all core flows
- **test/mocks/MockSTT.sol** - ERC20 mock token for testing
- **script/DeployEscrow.s.sol** - Foundry deployment script
- **frontend/src/constants/contracts.ts** - Frontend contract constants and ABIs

### Contract Responsibilities
- **Purpose**: Only escrow STT tokens and enable release after verified successful swap
- **Model**: Trusted relayer pattern with role-based access control

### Core Functions
- `deposit(uint256 amount)` - User deposits STT tokens into escrow
- `markExecuted(address user, uint256 returnedAmount, bytes32 txReference)` - Executor marks swap complete
- `withdraw()` - User withdraws their pending returns
- `refund(address user)` - Admin emergency refund
- `escrowOf(address user)` - View user's escrowed balance
- `pendingReturnOf(address user)` - View user's pending withdrawal amount

### Access Control
- **Admin Role**: Can refund users and manage roles
- **Executor Role**: Can mark swaps as executed
- Uses OpenZeppelin AccessControl for role management

### Security Features
- ReentrancyGuard protection
- SafeERC20 for secure token transfers
- Input validation on all functions
- Prevents double-withdrawal
- Role-based access control

## Deployment

### Prerequisites
1. Set up environment variables in `.env.local`:
```bash
STT_TOKEN_ADDRESS=0x_official_stt_token_address
PRIVATE_KEY=your_deployment_private_key
SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_KEY
SOMNIA_RPC=https://rpc.somnia.network
```

### Deploy to Sepolia
```bash
forge script script/DeployEscrow.s.sol --rpc-url sepolia --broadcast --verify
```

### Deploy to Somnia
```bash
forge script script/DeployEscrow.s.sol --rpc-url somnia --broadcast
```

### Post-Deployment
1. Update `.env.local` with deployed contract address:
```bash
NEXT_PUBLIC_ESCROW_ADDRESS=0x_deployed_escrow_address
```

2. Grant executor role to your relayer address:
```bash
cast send $ESCROW_ADDRESS "grantRole(bytes32,address)" \
  $(cast keccak256 "EXECUTOR_ROLE") $EXECUTOR_ADDRESS \
  --rpc-url sepolia --private-key $PRIVATE_KEY
```

## Testing

### Run All Tests
```bash
forge test --match-path "test/Escrow.t.sol" -vvv
```

### Run Specific Test
```bash
forge test --match-test "testDeposit" -vvv
```

### Test Coverage
```bash
forge coverage --match-path "test/Escrow.t.sol"
```

## Integration

### Frontend Usage
```typescript
import { ESCROW_CONTRACT_ADDRESS, ESCROW_ABI } from '@/constants/contracts';

// Deposit STT tokens
await escrowContract.deposit(amount);

// Check balances
const escrowBalance = await escrowContract.escrowOf(userAddress);
const pendingReturn = await escrowContract.pendingReturnOf(userAddress);

// Withdraw pending returns
await escrowContract.withdraw();
```

### Backend/Relayer Integration
```typescript
// Mark swap as executed (executor role required)
await escrowContract.markExecuted(
  userAddress,
  returnedAmount,
  ethers.utils.keccak256(txReference)
);
```

## Events
- `Deposited(address indexed user, uint256 amount)`
- `Executed(address indexed user, uint256 returnedAmount, bytes32 indexed txReference)`
- `Withdrawn(address indexed user, uint256 amount)`
- `Refunded(address indexed user, uint256 amount)`

## Gas Estimates
- Deposit: ~80k gas
- Mark Executed: ~110k gas
- Withdraw: ~98k gas
- Refund: ~103k gas

## Security Considerations
- Contract uses trusted relayer model - executor role has significant power
- Admin can emergency refund users
- All external calls use SafeERC20
- ReentrancyGuard protects against reentrancy attacks
- Input validation prevents common attack vectors

## Development

### Local Testing
```bash
# Install dependencies
forge install

# Run tests
forge test

# Deploy locally
anvil
forge script script/DeployEscrow.s.sol --fork-url http://localhost:8545 --broadcast
```