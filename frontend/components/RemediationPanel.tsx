import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export function RemediationPanel({ steps }: { steps: string[] }) {
  return (
    <Card className="bg-black border-gray-800 mt-4 rounded-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono text-[#00ff88] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          Recommended Remediation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-400">
          {steps.map((step, idx) => {
            // Parses markdown-style inline backticks into HTML code tags
            const formattedStep = step.split('`').map((part, i) => 
              i % 2 === 1 ? (
                <code key={i} className="bg-gray-900 text-gray-200 px-1.5 py-0.5 rounded font-mono text-xs border border-gray-700">
                  {part}
                </code>
              ) : (
                part
              )
            );
            return <li key={idx} className="leading-relaxed">{formattedStep}</li>;
          })}
        </ol>
      </CardContent>
    </Card>
  );
}