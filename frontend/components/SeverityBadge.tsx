import { Badge } from "@/components/ui/badge";
import { Severity } from "@/types/scan";

export function SeverityBadge({ severity }: { severity: Severity }) {
  // Explicitly typing the record ensures TS doesn't throw indexing warnings
  const styles: Record<Severity, string> = {
    CRITICAL: "bg-red-900/50 text-red-500 hover:bg-red-900/50 border border-red-800",
    HIGH: "bg-orange-900/50 text-orange-500 hover:bg-orange-900/50 border border-orange-800",
    MEDIUM: "bg-yellow-900/50 text-yellow-500 hover:bg-yellow-900/50 border border-yellow-800",
    LOW: "bg-blue-900/50 text-blue-500 hover:bg-blue-900/50 border border-blue-800",
    INFO: "bg-gray-800 text-gray-400 hover:bg-gray-800 border border-gray-700",
  };

  return (
    <Badge className={`${styles[severity]} font-mono font-bold uppercase tracking-wider`}>
      {severity}
    </Badge>
  );
}