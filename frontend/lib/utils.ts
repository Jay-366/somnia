import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function for combining Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format large numbers with appropriate suffixes
export function formatNumber(num: number, decimals: number = 2): string {
  if (num === 0) return "0";
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1e9) {
    return (num / 1e9).toFixed(decimals) + "B";
  } else if (absNum >= 1e6) {
    return (num / 1e6).toFixed(decimals) + "M";
  } else if (absNum >= 1e3) {
    return (num / 1e3).toFixed(decimals) + "K";
  } else if (absNum >= 1) {
    return num.toFixed(decimals);
  } else {
    // For small numbers, show more decimal places
    return num.toFixed(Math.max(decimals, 6));
  }
}

// Format currency values
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  decimals: number = 2
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

// Format token amounts with symbol
export function formatTokenAmount(
  amount: number | string,
  symbol: string,
  decimals: number = 4
): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${formatNumber(numAmount, decimals)} ${symbol}`;
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// Format time ago
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000; // Convert to seconds
  const diff = now - timestamp;
  
  if (diff < 60) {
    return `${Math.floor(diff)}s ago`;
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)}m ago`;
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h ago`;
  } else {
    return `${Math.floor(diff / 86400)}d ago`;
  }
}

// Truncate address for display
export function truncateAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

// Validate Ethereum address
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Convert timestamp to readable date
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

// Calculate price change percentage
export function calculatePriceChange(
  currentPrice: number,
  previousPrice: number
): number {
  if (previousPrice === 0) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

// Debounce function for search inputs
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Sleep utility for delays
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy text: ", err);
    return false;
  }
}

// Format gas price in Gwei
export function formatGasPrice(gasPrice: bigint): string {
  const gwei = Number(gasPrice) / 1e9;
  return `${gwei.toFixed(2)} Gwei`;
}

// Calculate transaction fee
export function calculateTxFee(gasUsed: bigint, gasPrice: bigint): string {
  const fee = Number(gasUsed * gasPrice) / 1e18;
  return fee.toFixed(6);
}

// Validate and format input amounts
export function validateAmount(
  amount: string,
  maxDecimals: number = 18
): { isValid: boolean; formatted: string; error?: string } {
  if (!amount || amount === "") {
    return { isValid: false, formatted: "", error: "Amount is required" };
  }

  // Remove leading/trailing whitespace
  const trimmed = amount.trim();
  
  // Check if it's a valid number
  if (!/^\d*\.?\d*$/.test(trimmed)) {
    return { isValid: false, formatted: "", error: "Invalid number format" };
  }

  const num = parseFloat(trimmed);
  
  if (isNaN(num) || num < 0) {
    return { isValid: false, formatted: "", error: "Amount must be positive" };
  }

  if (num === 0) {
    return { isValid: false, formatted: "", error: "Amount must be greater than 0" };
  }

  // Check decimal places
  const decimalPlaces = (trimmed.split(".")[1] || "").length;
  if (decimalPlaces > maxDecimals) {
    return {
      isValid: false,
      formatted: "",
      error: `Maximum ${maxDecimals} decimal places allowed`,
    };
  }

  return { isValid: true, formatted: trimmed };
}