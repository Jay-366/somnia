'use client';

import Link from "next/link";
import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";

export default function Nav() {
  return (
    <nav className="flex items-center justify-between px-8 py-6">
      <div className="flex items-center space-x-2">
        <div className="w-12 h-12 bg-gradient-to-br from-[rgb(178,255,238)] to-[rgb(30,255,195)] rounded-lg flex items-center justify-center">
          <span className="text-slate-900 font-bold text-xl">AFS</span>
        </div>
        <span className="text-white text-sm font-medium">ANTI FRAGILE SYSTEM</span>
      </div>
      
      <div className="hidden md:flex items-center space-x-8">
        <Link href="#about" className="text-gray-300 hover:text-white transition-colors">ABOUT US</Link>
        <Link href="#services" className="text-[rgb(178,255,238)] font-medium">SERVICES</Link>
        <Link href="#offers" className="text-gray-300 hover:text-white transition-colors">SPECIAL OFFERS</Link>
        <Link href="#news" className="text-gray-300 hover:text-white transition-colors">NEWS</Link>
        <Link href="#contacts" className="text-gray-300 hover:text-white transition-colors">CONTACTS</Link>
      </div>
      
      <div className="flex items-center">
        <ConnectButton 
          client={client}
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
          }}
        />
      </div>
    </nav>
  );
}