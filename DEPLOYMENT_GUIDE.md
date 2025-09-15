# Escrow Contract Deployment Guide

## Prerequisites

1. **Update STT Token Address in .env**
   ```bash
   STT_TOKEN_ADDRESS=<actual_somnia_stt_token_address>
   ```

2. **Verify Network Configuration**
   - Ensure `SOMNIA_RPC=https://rpc.somnia.network` is set
   - Ensure `PRIVATE_KEY` is set with your deployment key

## Deployment Commands

### Deploy to Somnia Testnet
```bash
forge script script/DeployEscrow.s.sol --rpc-url somnia --broadcast -vvv
```

### Alternative with environment variable
```bash
forge script script/DeployEscrow.s.sol --rpc-url $SOMNIA_RPC --broadcast -vvv
```

## Post-Deployment Steps

1. **Copy the deployed address** from the console output
2. **Update .env file** with the deployed address:
   ```bash
   NEXT_PUBLIC_ESCROW_ADDRESS=<deployed_contract_address>
   ```

3. **Grant executor role** (if needed for your relayer):
   ```bash
   cast send <ESCROW_ADDRESS> "grantRole(bytes32,address)" \
     $(cast keccak256 "EXECUTOR_ROLE") <EXECUTOR_ADDRESS> \
     --rpc-url somnia --private-key $PRIVATE_KEY
   ```

4. **Verify deployment** (optional):
   ```bash
   cast call <ESCROW_ADDRESS> "sttToken()" --rpc-url somnia
   ```

## Example Deployment Output
```
Deploying Escrow contract...
Network: Somnia Testnet
Deployer: 0x3324533837E165829b8E581B4F471125C9D8C66A
STT Token: 0x1234567890123456789012345678901234567890

========================================
DEPLOYMENT SUCCESSFUL!
========================================
Escrow Contract Address: 0xABCDEF1234567890ABCDEF1234567890ABCDEF12
STT Token Address: 0x1234567890123456789012345678901234567890
Admin/Owner: 0x3324533837E165829b8E581B4F471125C9D8C66A
========================================
Add to .env:
NEXT_PUBLIC_ESCROW_ADDRESS= 0xABCDEF1234567890ABCDEF1234567890ABCDEF12
========================================
```

## Troubleshooting

### Common Issues:
1. **"STT_TOKEN_ADDRESS not found"**
   - Make sure you've updated the .env file with the actual STT token address

2. **"Insufficient funds"**
   - Ensure your deployer address has enough Somnia testnet tokens

3. **"RPC connection failed"**
   - Verify SOMNIA_RPC endpoint is correct and accessible

### Verification Commands:
```bash
# Check deployer balance
cast balance $DEPLOYER_ADDRESS --rpc-url somnia

# Check if STT token exists
cast code $STT_TOKEN_ADDRESS --rpc-url somnia

# Test escrow contract after deployment
cast call $NEXT_PUBLIC_ESCROW_ADDRESS "sttToken()" --rpc-url somnia
```