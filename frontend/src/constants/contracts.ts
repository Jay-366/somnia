// Contract addresses and ABIs for the escrow system

export const ESCROW_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS || "";

// STT is the native token on Somnia (no contract address)

// Escrow Contract ABI (Native STT version)
export const ESCROW_ABI = [
  // Read functions
  "function escrowOf(address user) view returns (uint256)",
  "function pendingReturnOf(address user) view returns (uint256)", 
  "function totalBalanceOf(address user) view returns (uint256)",
  "function contractBalance() view returns (uint256)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function EXECUTOR_ROLE() view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  
  // Write functions (note: deposit is payable)
  "function deposit() payable",
  "function withdraw()",
  "function markExecuted(address user, uint256 returnedAmount, bytes32 txReference)",
  "function refund(address user)",
  "function grantRole(bytes32 role, address account)",
  "function revokeRole(bytes32 role, address account)",
  
  // Events
  "event Deposited(address indexed user, uint256 amount)",
  "event Executed(address indexed user, uint256 returnedAmount, bytes32 indexed txReference)",
  "event Withdrawn(address indexed user, uint256 amount)",
  "event Refunded(address indexed user, uint256 amount)",
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)"
] as const;

// STT is native token - no ABI needed, use standard ETH methods

// Network configurations
export const NETWORK_CONFIG = {
  sepolia: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: process.env.SEPOLIA_RPC || "",
  },
  somnia: {
    chainId: 50311, // Adjust based on actual Somnia testnet chain ID
    name: "Somnia Testnet", 
    rpcUrl: process.env.SOMNIA_RPC || "",
  }
} as const;

// Contract deployment addresses by network
export const CONTRACT_ADDRESSES = {
  somnia: {
    escrow: process.env.NEXT_PUBLIC_ESCROW_ADDRESS || "",
    // STT is native token on Somnia
  }
} as const;