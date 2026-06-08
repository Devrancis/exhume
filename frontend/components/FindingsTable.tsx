"use client";

import React, { useState } from "react";
import { Finding } from "@/types/scan";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "./SeverityBadge";
import { RemediationPanel } from "./RemediationPanel";
import { ChevronDown, ChevronRight, FileCode, GitCommit, User, CheckCircle } from "lucide-react";

export function FindingsTable({ findings }: { findings: Finding[] }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  if (findings.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800 border-dashed">
        <CardContent className="p-12 text-center text-gray-500 font-mono flex flex-col items-center justify-center">
          <CheckCircle className="w-12 h-12 text-gray-700 mb-4" />
          <p>No exposed secrets detected.</p>
          <p className="text-xs text-gray-600 mt-2">Your repository appears clean based on the current pattern definitions.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900">
      <Table>
        <TableHeader className="bg-black/50 hover:bg-black/50">
          <TableRow className="border-gray-800 border-b">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead className="font-mono text-gray-400">Severity</TableHead>
            <TableHead className="font-mono text-gray-400">Secret Type</TableHead>
            <TableHead className="font-mono text-gray-400">Location</TableHead>
            <TableHead className="font-mono text-gray-400">Redacted Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {findings.map((finding) => {
            const isExpanded = expandedRows.has(finding.finding_id);
            const isHistory = !!finding.commit_hash;

            return (
              <React.Fragment key={finding.finding_id}>
                {/* Main Row */}
                <TableRow 
                  className={`border-gray-800 cursor-pointer hover:bg-gray-800/50 transition-colors ${isExpanded ? "bg-gray-800/30" : ""}`}
                  onClick={() => toggleRow(finding.finding_id)}
                >
                  <TableCell className="p-4 text-gray-500">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </TableCell>
                  <TableCell className="p-4"><SeverityBadge severity={finding.severity} /></TableCell>
                  <TableCell className="p-4 font-mono text-white text-sm">{finding.secret_type}</TableCell>
                  <TableCell className="p-4 font-mono text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      {isHistory ? <GitCommit className="w-4 h-4 text-purple-400" /> : <FileCode className="w-4 h-4 text-blue-400" />}
                      <span className="truncate max-w-[200px] block" title={finding.file_path}>
                        {finding.file_path.split('/').pop()}
                      </span>
                      {!isHistory && <span className="text-gray-600">:{finding.line_number}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="p-4 font-mono text-[#00ff88] text-sm">
                    {finding.redacted_value}
                  </TableCell>
                </TableRow>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <TableRow className="border-gray-800 bg-black/40 hover:bg-black/40">
                    <TableCell colSpan={5} className="p-0">
                      <div className="p-6 border-l-2 border-[#00ff88] ml-[22px] my-4 bg-gray-900 rounded-r-lg space-y-6 shadow-inner">
                        
                        {/* Meta Data Grid */}
                        <div className="grid grid-cols-2 gap-4 font-mono text-sm">
                          <div>
                            <div className="text-gray-500 mb-1 text-xs uppercase tracking-wider">Full File Path</div>
                            <code className="bg-black px-2 py-1 rounded border border-gray-800 text-gray-300 break-all select-all">
                              {finding.file_path}
                            </code>
                          </div>
                          
                          {isHistory && (
                            <div className="space-y-3">
                              <div>
                                <div className="text-gray-500 mb-1 text-xs uppercase tracking-wider">Commit Information</div>
                                <div className="flex items-center gap-2 text-gray-300">
                                  <code className="bg-black px-2 py-1 rounded border border-gray-800 text-purple-400 select-all">
                                    {finding.commit_hash?.substring(0, 8)}
                                  </code>
                                  <span className="text-gray-500 text-xs">
                                    {finding.commit_date && new Date(finding.commit_date).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-gray-400 text-xs">
                                <User className="w-3 h-3" />
                                <span>{finding.commit_author}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Remediation Injection */}
                        <RemediationPanel steps={finding.remediation_steps} />
                        
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}