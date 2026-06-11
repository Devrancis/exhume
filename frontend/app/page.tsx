"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [token, setToken] = useState("");
  const [history, setHistory] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null); 

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API base URL is not configured.");
      }

      const res = await fetch(`${apiUrl}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          repo_url: repoUrl, 
          github_token: token || null, 
          scan_history: history, 
          branches: ["main"] 
        })
      });

      // Catch backend errors (400 Bad Request, 500 Internal Server Error)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      
      if (!data.job_id) {
        throw new Error("Invalid response from the scanning engine.");
      }

      router.push(`/scan/${data.job_id}`);
      
    } catch (err) {
      console.error("Echelon Scan Error:", err);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to initialize scan. Please try again.");
      }
      
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-gray-300 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-mono font-bold text-[#00ff88]">Echelon.</h1>
          <p className="text-xl">Find secrets in your code before attackers do.</p>
          <p className="text-sm text-gray-500">Scans repos, histories, and branches for exposed credentials and API keys.</p>
        </div>

        <form onSubmit={handleScan} className="bg-gray-900 p-8 rounded-xl border border-gray-800 space-y-6">
          
          {/* Error Boundary Display */}
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded text-sm font-mono">
              [!] Error: {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">GitHub Repository URL</label>
            <input required type="url" placeholder="https://github.com/owner/repo" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] outline-none transition-colors" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">GitHub Token (Optional, for private repos)</label>
            <input type="password" placeholder="ghp_..." value={token} onChange={(e) => setToken(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] outline-none transition-colors" />
          </div>

          <div className="flex items-center space-x-3">
            <input type="checkbox" id="history" checked={history} onChange={(e) => setHistory(e.target.checked)} className="w-5 h-5 accent-[#00ff88]" />
            <label htmlFor="history" className="text-sm">Scan full git history (Commits & Branches)</label>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-[#00ff88] text-black font-bold py-3 rounded hover:bg-[#00d4ff] transition-colors disabled:opacity-50">
            {loading ? "Initializing Engine..." : "Run Scan"}
          </button>
        </form>
        <div className="text-center text-xs text-gray-600 font-mono">
          10,000+ secrets detected | 50+ secret patterns | Full history traversal
        </div>
      </div>
    </main>
  );
}