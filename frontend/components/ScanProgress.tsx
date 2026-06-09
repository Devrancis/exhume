import { ScanProgress as ScanProgressType } from "@/types/scan";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle} from "lucide-react";

interface Props {
  progress: ScanProgressType;
  status: "queued" | "running" | "completed" | "failed";
}

export function ScanProgress({ progress, status }: Props) {
  const isRunning = status === "running" || status === "queued";
  const isFailed = status === "failed";
  const isCompleted = status === "completed";

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            {isRunning && <Loader2 className="w-5 h-5 text-[#00d4ff] animate-spin" />}
            {isCompleted && <CheckCircle className="w-5 h-5 text-[#00ff88]" />}
            {isFailed && <XCircle className="w-5 h-5 text-[#ff3b3b]" />}
            <span className="font-mono text-lg text-white font-bold tracking-wide uppercase">
              {status === "queued" ? "Queued for Scanning" : progress.current_step}
            </span>
          </div>
          <span className="font-mono text-[#00ff88] font-bold">{progress.percent}%</span>
        </div>

        <div className="w-full bg-black h-3 rounded-full overflow-hidden border border-gray-700 mb-4">
          <div 
            className={`h-full transition-all duration-500 ease-out ${isFailed ? "bg-[#ff3b3b]" : "bg-[#00ff88]"}`}
            style={{ width: `${progress.percent}%` }} 
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono text-gray-400">
          <div className="flex flex-col border-l border-gray-800 pl-3">
            <span className="text-gray-600 text-xs">Files Scanned</span>
            <span className="text-white">{progress.files_scanned.toLocaleString()}</span>
          </div>
          <div className="flex flex-col border-l border-gray-800 pl-3">
            <span className="text-gray-600 text-xs">Commits Traversed</span>
            <span className="text-white">{progress.commits_traversed.toLocaleString()}</span>
          </div>
          <div className="flex flex-col border-l border-gray-800 pl-3">
            <span className="text-gray-600 text-xs">Status</span>
            <span className={isCompleted ? "text-[#00ff88]" : isFailed ? "text-[#ff3b3b]" : "text-[#00d4ff]"}>
              {status.toUpperCase()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}