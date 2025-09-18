'use client';

import Link from "next/link";
import Image from "next/image";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client, supportedChains } from "@/lib/thirdweb";
import { NetworkSwitcher, NetworkSwitcherMobile } from "./NetworkSwitcher";

export default function Nav() {
  const account = useActiveAccount();
  
  return (
    <nav className="fixed top-0 left-0 w-full z-40 flex items-center justify-between px-8 py-6 bg-black/10 backdrop-blur-sm border-b border-slate-800/20">
      <Link href="/" className="group flex items-center space-x-3 hover:opacity-90 transition-all">
        <div className="relative w-12 h-12 rounded-lg overflow-hidden ring-0 bg-slate-900/40 flex items-center justify-center group-hover:ring-[rgb(30,255,195)]/40">
          <Image 
            src="/defi-nitely.png" 
            alt="Defi-nitely Logo" 
            fill 
            sizes="48px"
            className="object-contain p-1 drop-shadow-[0_0_4px_rgba(30,255,195,0.25)]"
            priority
          />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-white font-bold tracking-wide text-lg group-hover:text-[rgb(178,255,238)] transition-colors">
            Defi-nitely
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-[rgb(178,255,238)]/70 group-hover:text-[rgb(30,255,195)]/90">
            Multi-Network Arbitrage
          </span>
        </div>
      </Link>
      
      <div className="hidden md:flex items-center space-x-8">
  <Link href="/dashboard" className="text-[rgb(178,255,238)] font-medium hover:text-white transition-colors">Dashboard</Link>
  <Link href="/arbitrage" className="text-gray-300 hover:text-white transition-colors">Arbitrage</Link>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Network Switcher - Only show when wallet is connected */}
        {account && (
          <>
            {/* Network Switcher - Desktop */}
            <div className="hidden md:block">
              <NetworkSwitcher />
            </div>
            
            {/* Network Switcher - Mobile */}
            <div className="md:hidden">
              <NetworkSwitcherMobile />
            </div>
          </>
        )}
        
        {/* Wallet Connect Button */}
        <ConnectButton 
          client={client}
          chains={supportedChains}
          theme="dark"
          connectButton={{
            style: {
              backgroundColor: "rgb(30,255,195)",
              color: "#0f172a",
              fontWeight: "600",
              borderRadius: "9999px",
              padding: "8px 16px",
              fontSize: "14px",
              transition: "all 0.3s ease",
            }
          }}
          connectModal={{
            title: "Connect to AFS",
            titleIcon: "",
            welcomeScreen: {
              title: "Welcome to Anti Fragile System",
              subtitle: "Connect your wallet to access arbitrage features across multiple networks",
            },
          }}
        />
      </div>
    </nav>
  );
}