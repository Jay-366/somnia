'use client';

import Link from "next/link";
import Image from "next/image";
import { Github, Twitter, Linkedin, Mail, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Image 
                src="/defi-nitely.png" 
                alt="Defi-nitely" 
                width={40} 
                height={40} 
                className="rounded-lg"
              />
              <span className="text-2xl font-bold text-white">Defi-nitely</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Advanced arbitrage solutions for DeFi traders. Identify profitable opportunities 
              between DEX pools and oracle feeds with real-time analytics.
            </p>
            <div className="flex space-x-4">
              <Link 
                href="#" 
                className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </Link>
              <Link 
                href="#" 
                className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors"
                aria-label="GitHub"
              >
                <Github size={20} />
              </Link>
              <Link 
                href="#" 
                className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </Link>
              <Link 
                href="mailto:contact@defi-nitely.com" 
                className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </Link>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Products</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors text-sm">
                  Trading Dashboard
                </Link>
              </li>
              <li>
                <Link href="/arbitrage" className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors text-sm">
                  Arbitrage Scanner
                </Link>
              </li>
              <li>
                <Link href="/pyth" className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors text-sm">
                  Oracle Feeds
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors text-sm">
                  Market Analytics
                </Link>
              </li>
              <li>
                <Link href="/strategies" className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors text-sm">
                  Trading Strategies
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/docs" className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors text-sm">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors text-sm">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/tutorials" className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors text-sm">
                  Tutorials
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors text-sm">
                  Support Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors text-sm">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors text-sm">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2025 Defi-nitely. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <Link href="/status" className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>System Status</span>
              </Link>
              <div className="text-gray-500">|</div>
              <Link 
                href="https://uniswap.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[rgb(30,255,195)] transition-colors flex items-center space-x-1"
              >
                <span>Powered by Uniswap V4</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}