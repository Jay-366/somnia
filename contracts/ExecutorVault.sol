// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Uniswap V4 imports
import {IPoolManager} from "lib/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "lib/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "lib/v4-core/src/types/Currency.sol";
import {IHooks} from "lib/v4-core/src/interfaces/IHooks.sol";
import {PoolSwapTest} from "lib/v4-core/src/test/PoolSwapTest.sol";
import {SwapParams} from "lib/v4-core/src/types/PoolOperation.sol";

// WETH interface for unwrapping
interface IWETH {
    function withdraw(uint256 wad) external;
    function deposit() external payable;
    function balanceOf(address owner) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
}

/**
 * @title ExecutorVault
 * @dev Vault contract for AOT→WETH swaps with balance tracking and withdrawal
 * Deployed on Sepolia testnet to work with existing Uniswap V4 pool
 */
contract ExecutorVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using CurrencyLibrary for Currency;

    // ========= CONSTANTS =========
    // Sepolia addresses from your deployment
    address public constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address public constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address public constant AOT = 0xD98f9971773045735C62cD8f1a70047f81b9a468;
    
    // Pool configuration - matches your existing pool
    uint24 public constant POOL_FEE = 3000; // 0.3%
    int24 public constant TICK_SPACING = 60;

    // ========= STATE VARIABLES =========
    IPoolManager public immutable poolManager;
    PoolSwapTest public swapRouter;
    PoolKey public poolKey;
    
    // User balances: balances[user][token] = amount
    mapping(address => mapping(address => uint256)) public balances;
    
    // Track total balances for each token
    mapping(address => uint256) public totalBalances;

    // ========= EVENTS =========
    event SwapExecuted(
        address indexed user,
        uint256 aotAmountIn,
        uint256 wethAmountOut,
        uint256 timestamp
    );
    
    event Deposit(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    
    event Withdrawal(
        address indexed user,
        address indexed token,
        uint256 amount,
        bool unwrapped
    );

    // ========= CONSTRUCTOR =========
    constructor() Ownable(msg.sender) {
        poolManager = IPoolManager(POOL_MANAGER);
        
        // Deploy swap router for this vault
        swapRouter = new PoolSwapTest(poolManager);
        
        // Configure pool key (same as your existing pool)
        Currency wethCurrency = Currency.wrap(WETH);
        Currency aotCurrency = Currency.wrap(AOT);
        
        poolKey = PoolKey({
            currency0: wethCurrency < aotCurrency ? wethCurrency : aotCurrency,
            currency1: wethCurrency < aotCurrency ? aotCurrency : wethCurrency,
            fee: POOL_FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(address(0))
        });
    }

    // ========= MAIN FUNCTIONS =========

    /**
     * @dev Execute AOT → WETH swap and store WETH in vault
     * @param aotAmountIn Amount of AOT to swap
     * @return wethAmountOut Amount of WETH received and stored
     */
    function executeSwap(uint256 aotAmountIn) external nonReentrant returns (uint256 wethAmountOut) {
        require(aotAmountIn > 0, "ExecutorVault: Amount must be greater than 0");
        
        // Transfer AOT from user to this contract
        IERC20(AOT).safeTransferFrom(msg.sender, address(this), aotAmountIn);
        
        // Get WETH balance before swap
        uint256 wethBefore = IERC20(WETH).balanceOf(address(this));
        
        // Approve swap router to spend AOT
        IERC20(AOT).approve(address(swapRouter), aotAmountIn);
        
        // Determine swap direction: AOT → WETH
        // If AOT is currency0, then zeroForOne = true
        // If WETH is currency0, then zeroForOne = false
        bool zeroForOne = Currency.wrap(AOT) == poolKey.currency0;
        
        // Configure swap parameters
        SwapParams memory params = SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: -int256(aotAmountIn), // Negative for exact input
            sqrtPriceLimitX96: zeroForOne
                ? 4295128740 // MIN_SQRT_RATIO + 1
                : 1461446703485210103287273052203988822378723970341 // MAX_SQRT_RATIO - 1
        });

        // Execute swap
        PoolSwapTest.TestSettings memory testSettings = 
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false});
        
        swapRouter.swap(poolKey, params, testSettings, "");
        
        // Calculate WETH received
        uint256 wethAfter = IERC20(WETH).balanceOf(address(this));
        wethAmountOut = wethAfter - wethBefore;
        
        require(wethAmountOut > 0, "ExecutorVault: Swap failed - no WETH received");
        
        // Update user balance
        balances[msg.sender][WETH] += wethAmountOut;
        totalBalances[WETH] += wethAmountOut;
        
        emit SwapExecuted(msg.sender, aotAmountIn, wethAmountOut, block.timestamp);
        
        return wethAmountOut;
    }

    /**
     * @dev Withdraw tokens from vault
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     * @param unwrap If true and token is WETH, unwrap to ETH before sending
     */
    function withdraw(address token, uint256 amount, bool unwrap) external nonReentrant {
        require(amount > 0, "ExecutorVault: Amount must be greater than 0");
        require(balances[msg.sender][token] >= amount, "ExecutorVault: Insufficient balance");
        
        // Update balances
        balances[msg.sender][token] -= amount;
        totalBalances[token] -= amount;
        
        if (unwrap && token == WETH) {
            // Unwrap WETH to ETH and send ETH to user
            IWETH(WETH).withdraw(amount);
            
            // Send ETH to user
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "ExecutorVault: ETH transfer failed");
            
            emit Withdrawal(msg.sender, token, amount, true);
        } else {
            // Send token directly
            IERC20(token).safeTransfer(msg.sender, amount);
            emit Withdrawal(msg.sender, token, amount, false);
        }
    }

    /**
     * @dev Deposit tokens directly to vault (for manual deposits)
     * @param token Token address to deposit
     * @param amount Amount to deposit
     */
    function deposit(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "ExecutorVault: Amount must be greater than 0");
        require(token == WETH || token == AOT, "ExecutorVault: Unsupported token");
        
        // Transfer token from user
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Update balances
        balances[msg.sender][token] += amount;
        totalBalances[token] += amount;
        
        emit Deposit(msg.sender, token, amount);
    }

    // ========= VIEW FUNCTIONS =========

    /**
     * @dev Get user balance for a specific token
     * @param user User address
     * @param token Token address
     * @return User's balance
     */
    function getUserBalance(address user, address token) external view returns (uint256) {
        return balances[user][token];
    }

    /**
     * @dev Get user balances for both WETH and AOT
     * @param user User address
     * @return wethBalance User's WETH balance
     * @return aotBalance User's AOT balance
     */
    function getUserBalances(address user) external view returns (uint256 wethBalance, uint256 aotBalance) {
        return (balances[user][WETH], balances[user][AOT]);
    }

    /**
     * @dev Get total vault balances
     * @return wethTotal Total WETH in vault
     * @return aotTotal Total AOT in vault
     */
    function getTotalBalances() external view returns (uint256 wethTotal, uint256 aotTotal) {
        return (totalBalances[WETH], totalBalances[AOT]);
    }

    /**
     * @dev Get actual contract token balances (for verification)
     * @return wethActual Actual WETH balance of contract
     * @return aotActual Actual AOT balance of contract
     */
    function getContractBalances() external view returns (uint256 wethActual, uint256 aotActual) {
        return (IERC20(WETH).balanceOf(address(this)), IERC20(AOT).balanceOf(address(this)));
    }

    /**
     * @dev Get pool key information
     * @return currency0 First currency in pool
     * @return currency1 Second currency in pool
     * @return fee Pool fee
     * @return tickSpacing Pool tick spacing
     */
    function getPoolInfo() external view returns (
        address currency0,
        address currency1,
        uint24 fee,
        int24 tickSpacing
    ) {
        return (
            Currency.unwrap(poolKey.currency0),
            Currency.unwrap(poolKey.currency1),
            poolKey.fee,
            poolKey.tickSpacing
        );
    }

    // ========= ADMIN FUNCTIONS =========

    /**
     * @dev Emergency withdrawal function (owner only)
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    /**
     * @dev Emergency ETH withdrawal (owner only)
     */
    function emergencyWithdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "ExecutorVault: No ETH to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "ExecutorVault: ETH transfer failed");
    }

    // ========= RECEIVE FUNCTION =========
    
    /**
     * @dev Receive ETH (needed for WETH unwrapping)
     */
    receive() external payable {
        // Allow receiving ETH from WETH contract during unwrapping
    }
}