'use client';

import Nav from "@/components/Nav";

export default function PythPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Nav />
      
      {/* Page Content */}
      <div className="px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
              Oracle <span className="text-[rgb(30,255,195)]">Feeds</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Real-time price feeds from Pyth Network oracle
            </p>
          </div>
          
          {/* Oracle content will go here */}
          <div className="text-center text-gray-400">
            <p>Oracle dashboard coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}