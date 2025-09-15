# Deploy Escrow Contract to Somnia Testnet

## Ready to Deploy! ✅

Your escrow contract system is now configured for **native STT tokens** on Somnia testnet.

### Pre-Deployment Checklist
- ✅ EscrowNative contract created for native STT tokens
- ✅ Comprehensive tests (14/14 passing)
- ✅ Deployment script configured for Somnia
- ✅ RPC endpoint updated to `https://vsf-rpc.somnia.network/`
- ✅ Frontend constants updated for native tokens

### Deploy Command
```bash
forge script script/DeployEscrowNative.s.sol --rpc-url somnia --broadcast -vvv
```

### Expected Output
```
Deploying EscrowNative contract...
Network: Somnia Testnet
Native Token: STT
Deployer: 0x3324533837E165829b8E581B4F471125C9D8C66A

========================================
DEPLOYMENT SUCCESSFUL!
========================================
EscrowNative Contract Address: 0x...
Native Token: STT (no contract address)
Admin/Owner: 0x3324533837E165829b8E581B4F471125C9D8C66A
========================================
Add to .env:
NEXT_PUBLIC_ESCROW_ADDRESS= 0x...
========================================
```

### Post-Deployment Steps

1. **Update .env with deployed address:**
```bash
NEXT_PUBLIC_ESCROW_ADDRESS=<deployed_contract_address>
```

2. **Test the deployment:**
```bash
# Check contract balance
cast call $NEXT_PUBLIC_ESCROW_ADDRESS "contractBalance()" --rpc-url somnia

# Test deposit (replace with your address)
cast send $NEXT_PUBLIC_ESCROW_ADDRESS "deposit()" --value 0.1ether --rpc-url somnia --private-key $PRIVATE_KEY

# Check your escrow balance
cast call $NEXT_PUBLIC_ESCROW_ADDRESS "escrowOf(address)" $DEPLOYER_ADDRESS --rpc-url somnia
```

3. **Grant executor role to your relayer:**
```bash
cast send $NEXT_PUBLIC_ESCROW_ADDRESS "grantRole(bytes32,address)" \
  $(cast keccak256 "EXECUTOR_ROLE") <EXECUTOR_ADDRESS> \
  --rpc-url somnia --private-key $PRIVATE_KEY
```

### Key Differences from ERC20 Version
- ✅ **No token approvals needed** - STT is native
- ✅ **Simpler frontend integration** - use `msg.value` for deposits
- ✅ **Gas efficient** - no ERC20 transfer calls
- ✅ **Direct balance checks** - use `address.balance`

### Contract Features
- **Deposit**: Send STT directly with `deposit()` payable function
- **Execute**: Trusted relayer marks swaps complete
- **Withdraw**: Users pull their pending returns
- **Refund**: Admin emergency refund capability
- **Security**: ReentrancyGuard + AccessControl

Ready to deploy! 🚀