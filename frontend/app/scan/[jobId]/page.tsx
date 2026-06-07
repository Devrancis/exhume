"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ScanResult, Finding } from "@/types/scan";

export default function ScanDashboard() {
  const { jobId } = useParams();
  const [data, setData] = useState<ScanResult | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scan/${jobId}`);
      if (res.ok) {
        const json: ScanResult = await res.json();
        setData(json);
        if (json.status === "completed" || json.status === "failed") clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [jobId]);

  if (!data) return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Loading...</div>;

  const isScanning = data.status === "queued" || data.status === "running";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-300 p-8 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Progress */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
          <h2 className="text-2xl font-bold text-white mb-4">Scan Job: {jobId}</h2>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 bg-black h-4 rounded-full overflow-hidden border border-gray-700">
              <div className="bg-[#00ff88] h-full transition-all duration-500" style={{ width: `${data.progress.percent}%` }} />
            </div>
            <span className="text-sm">{data.progress.percent}%</span>
          </div>
          <p className="text-[#00d4ff]">{data.progress.current_step}</p>
          <div className="flex space-x-6 mt-4 text-sm text-gray-500">
            <span>Files: {data.progress.files_scanned}</span>
            <span>Commits: {data.progress.commits_traversed}</span>
          </div>
        </div>

        {/* Results Dashboard */}
        {!isScanning && data.findings && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <StatCard title="Total Findings" value={data.findings.length} color="text-white" />
              <StatCard title="Critical" value={data.findings.filter(f => f.severity === 'CRITICAL').length} color="text-[#ff3b3b]" />
              <StatCard title="High" value={data.findings.filter(f => f.severity === 'HIGH').length} color="text-[#ff8c00]" />
              <StatCard title="Medium/Low" value={data.findings.filter(f => f.severity === 'MEDIUM' || f.severity === 'LOW').length} color="text-yellow-400" />
            </div>

            <div className="flex justify-end">
               <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/report/${jobId}/pdf`} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm border border-gray-700">
                 Download PDF Report
               </a>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-black text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Secret Type</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Redacted Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {data.findings.map((finding, idx) => (
                    <tr key={idx} className="hover:bg-gray-800/50">
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          finding.severity === 'CRITICAL' ? 'bg-red-900/50 text-[#ff3b3b] border border-red-800' :
                          finding.severity === 'HIGH' ? 'bg-orange-900/50 text-[#ff8c00] border border-orange-800' :
                          'bg-yellow-900/50 text-yellow-400 border border-yellow-800'
                        }`}>{finding.severity}</span>
                      </td>
                      <td className="p-4 text-white">{finding.secret_type}</td>
                      <td className="p-4">
                        <div>{finding.file_path}:{finding.line_number}</div>
                        {finding.commit_hash && <div className="text-xs text-gray-500 mt-1">Commit: {finding.commit_hash.substring(0,7)}</div>}
                      </td>
                      <td className="p-4 text-[#00ff88]">{finding.redacted_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.findings.length === 0 && <div className="p-8 text-center text-gray-500">No secrets found. Your repository is clean.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string, value: number, color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
      <div className="text-sm text-gray-500 mb-2">{title}</div>
      <div className={`text-4xl font-bold ${color}`}>{value}</div>
    </div>
  );
}