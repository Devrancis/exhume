"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ScanResult } from "@/types/scan";
import { ScanProgress } from "@/components/ScanProgress";
import { FindingsTable } from "@/components/FindingsTable";
import { SecretTypeChart } from "@/components/SecretTypeChart";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, AlertTriangle, Info, ArrowLeft, Download } from "lucide-react";

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
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center font-mono text-[#00ff88] gap-3">
        <div className="w-6 h-6 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
        <span>Initializing telemetry link...</span>
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
    <div className="min-h-screen bg-[#0a0a0f] text-gray-300 p-8 font-sans relative overflow-hidden">
      
      {/* Ambient Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-5%] w-[45%] h-[45%] bg-emerald-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* Breadcrumb / Back Navigation Link */}
        <div className="mb-4">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-gray-400 hover:text-blue-400 font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Homepage
          </Link>
        </div>
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b border-gray-800/60 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
              Security Audit Report
            </h1>
            <p className="text-gray-500 font-mono text-sm mt-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Job ID: <span className="text-gray-400">{jobId}</span>
            </p>
          </div>
          {!isScanning && (
            <a 
              href={`${process.env.NEXT_PUBLIC_API_URL}/api/report/${jobId}/pdf`} 
              className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-800 hover:border-gray-700 transition-all shadow-xl flex items-center gap-2 group shrink-0 self-start sm:self-auto"
            >
              <Download className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              Download PDF Export
            </a>
          )}
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-900/60 text-red-400 p-4 rounded-xl font-mono text-sm backdrop-blur-sm animate-in fade-in duration-300">
            {error}
          </div>
        )}

        {data && (
          <div className="bg-gray-900/30 border border-gray-800/60 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
            <ScanProgress progress={data.progress} status={data.status} />
          </div>
        )}

        {!isScanning && data && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 pt-4">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Exposed Secrets" value={totalFindings} icon={<ShieldAlert className="w-5 h-5 text-blue-400" />} color="text-white" glowColor="group-hover:border-blue-500/30" />
              <StatCard title="Critical Severity" value={criticalCount} icon={<AlertTriangle className="w-5 h-5 text-rose-500" />} color="text-rose-500" glowColor="group-hover:border-rose-500/30" />
              <StatCard title="High Severity" value={highCount} icon={<AlertTriangle className="w-5 h-5 text-orange-500" />} color="text-orange-500" glowColor="group-hover:border-orange-500/30" />
              <StatCard title="Medium / Low Severity" value={medLowCount} icon={<Info className="w-5 h-5 text-yellow-500" />} color="text-yellow-500" glowColor="group-hover:border-yellow-500/30" />
            </div>

            {/* Layout Grid for Chart and Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-gray-900/20 border border-gray-800/60 rounded-2xl p-2 backdrop-blur-sm hover:border-gray-800 transition-colors shadow-lg">
                <SecretTypeChart findings={findings} />
              </div>
              <div className="lg:col-span-2 bg-gray-900/20 border border-gray-800/60 rounded-2xl p-2 backdrop-blur-sm hover:border-gray-800 transition-colors shadow-lg">
                <FindingsTable findings={findings} />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
}

function StatCard({ title, value, icon, color, glowColor }: StatCardProps) {
  return (
    <Card className={`bg-gray-900/40 border-gray-800/70 backdrop-blur-md rounded-2xl transition-all duration-300 group hover:bg-gray-950/60 shadow-lg ${glowColor}`}>
      <CardContent className="p-6 flex flex-col justify-between h-36">
        <div className="flex justify-between items-start">
          <span className="text-sm font-semibold text-gray-400 tracking-wide">{title}</span>
          <div className="p-2 bg-gray-950/50 rounded-xl border border-gray-800/50 group-hover:scale-105 transition-transform">
            {icon}
          </div>
        </div>
        <div className={`text-4xl font-extrabold font-mono tracking-tight ${color}`}>
          {value.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}