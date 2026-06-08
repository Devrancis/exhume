"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Finding } from "@/types/scan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SecretTypeChart({ findings }: { findings: Finding[] }) {
  // Aggregate occurrences of each secret type
  const dataMap = findings.reduce((acc, f) => {
    acc[f.secret_type] = (acc[f.secret_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort and grab the top 5 culprits
  const data = Object.entries(dataMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-sm font-mono text-gray-400 uppercase tracking-wide">Top Secret Types Detected</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: 'monospace' }} />
                <Tooltip 
                  cursor={{ fill: '#1f2937' }} 
                  contentStyle={{ backgroundColor: '#000', borderColor: '#374151', color: '#00ff88', fontSize: '12px', fontFamily: 'monospace' }} 
                  itemStyle={{ color: '#00ff88' }}
                />
                <Bar dataKey="count" fill="#00ff88" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-600 font-mono">
              No data to display
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}