"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, History, ArrowRight } from "lucide-react";

export default function SearchInput() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history from the browser when the component mounts
  useEffect(() => {
    const saved = localStorage.getItem("exhume_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleScan = (scanUrl: string) => {
    if (!scanUrl) return;
    
    // Save to local storage (keep the last 5 unique repos)
    const updatedHistory = [scanUrl, ...history.filter(h => h !== scanUrl)].slice(0, 5);
    setHistory(updatedHistory);
    localStorage.setItem("exhume_history", JSON.stringify(updatedHistory));
    
    setShowHistory(false);
    // Route to your loading/scanning page (adjust this route to match yours)
    router.push(`/scan?repo=${encodeURIComponent(scanUrl)}`);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-slate-400" />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setShowHistory(true)}
          onBlur={() => setTimeout(() => setShowHistory(false), 200)} // Delay hides so clicks register
          placeholder="https://github.com/user/repository"
          className="w-full py-4 pl-12 pr-16 text-lg bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-lg"
        />
        <button 
          onClick={() => handleScan(url)}
          className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* History Dropdown */}
      {showHistory && history.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/50">
            Recent Scans
          </div>
          {history.map((pastUrl, idx) => (
            <button
              key={idx}
              onClick={() => handleScan(pastUrl)}
              className="w-full flex items-center px-4 py-3 hover:bg-slate-700 transition-colors text-left text-sm text-slate-200"
            >
              <History className="w-4 h-4 mr-3 text-slate-400" />
              {pastUrl}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}