"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ScanResult } from "@/types/scan";
import { ScanProgress } from "@/components/ScanProgress";
import { FindingsTable } from "@/components/FindingsTable";
import { SecretTypeChart } from "@/components/SecretTypeChart";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, ShieldCheck, AlertTriangle, Info } from "lucide-react";

export default function ScanDashboard() {
  const { jobId } = useParams();
  const [data, setData] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scan/${jobId}`);
        if (!res.ok) throw new Error("Failed to fetch scan status");
        
        const json: ScanResult = await res.json();
        setData(json);
        
        if (json.status === "completed" || json.status === "failed") {
          clearInterval(pollInterval);
        }
      } catch (err) {
        setError("Unable to connect to the scanning engine. Retrying...");
        console.error(err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [jobId]);

  if (!data && !error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-[#00ff88]">
        Initializing telemetry link...
      </div>
    );
  }

  const findings = data?.findings || [];
  const isScanning = data?.status === "queued" || data?.status === "running";

  // Calculate stats
  const totalFindings = findings.length;
  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  const medLowCount = findings.filter(f => f.severity === 'MEDIUM' || f.severity === 'LOW').length;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-300 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Security Audit Report</h1>
            <p className="text-gray-500 font-mono text-sm mt-1">Job ID: {jobId}</p>
          </div>
          {!isScanning && (
            <a 
              href={`${process.env.NEXT_PUBLIC_API_URL}/api/report/${jobId}/pdf`} 
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium border border-gray-700 transition-colors flex items-center gap-2"
            >
              Download PDF Export
            </a>
          )}
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-800 text-red-500 p-4 rounded-lg font-mono text-sm">
            {error}
          </div>
        )}

        {data && <ScanProgress progress={data.progress} status={data.status} />}

        {!isScanning && data && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-4">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard title="Total Exposed Secrets" value={totalFindings} icon={<ShieldAlert className="w-5 h-5 text-gray-400" />} color="text-white" />
              <StatCard title="Critical Severity" value={criticalCount} icon={<AlertTriangle className="w-5 h-5 text-red-500" />} color="text-red-500" />
              <StatCard title="High Severity" value={highCount} icon={<AlertTriangle className="w-5 h-5 text-orange-500" />} color="text-orange-500" />
              <StatCard title="Medium / Low Severity" value={medLowCount} icon={<Info className="w-5 h-5 text-yellow-500" />} color="text-yellow-500" />
            </div>

            {/* Layout Grid for Chart and Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <SecretTypeChart findings={findings} />
              </div>
              <div className="lg:col-span-2">
                <FindingsTable findings={findings} />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-6 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-4">
          <span className="text-sm font-medium text-gray-400">{title}</span>
          {icon}
        </div>
        <div className={`text-4xl font-bold font-mono ${color}`}>
          {value.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}