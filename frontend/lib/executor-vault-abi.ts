// ExecutorVault ABI for frontend integration
export const ExecutorVaultABI = [
  // Read functions
  "function getUserBalance(address user, address token) external view returns (uint256)",
  "function getUserBalances(address user) external view returns (uint256 wethBalance, uint256 aotBalance)",
  "function getTotalBalances() external view returns (uint256 wethTotal, uint256 aotTotal)",
  "function getContractBalances() external view returns (uint256 wethActual, uint256 aotActual)",
  "function getPoolInfo() external view returns (address currency0, address currency1, uint24 fee, int24 tickSpacing)",
  "function balances(address user, address token) external view returns (uint256)",
  "function totalBalances(address token) external view returns (uint256)",
  "function owner() external view returns (address)",
  
  // Constants
  "function WETH() external view returns (address)",
  "function AOT() external view returns (address)",
  "function POOL_MANAGER() external view returns (address)",
  "function POOL_FEE() external view returns (uint24)",
  "function TICK_SPACING() external view returns (int24)",
  
  // Write functions
  "function executeSwap(uint256 aotAmountIn) external returns (uint256 wethAmountOut)",
  "function withdraw(address token, uint256 amount, bool unwrap) external",
  "function deposit(address token, uint256 amount) external",
  
  // Admin functions
  "function emergencyWithdraw(address token, uint256 amount) external",
  "function emergencyWithdrawETH() external",
  
  // Events
  "event SwapExecuted(address indexed user, uint256 aotAmountIn, uint256 wethAmountOut, uint256 timestamp)",
  "event Deposit(address indexed user, address indexed token, uint256 amount)",
  "event Withdrawal(address indexed user, address indexed token, uint256 amount, bool unwrapped)",
] as const;