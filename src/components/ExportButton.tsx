"use client";

import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { exportCsv, exportJson } from "@/lib/export";

interface Props {
  headers: string[];
  rows: (string | number)[][];
  jsonData: unknown;
  filenameBase: string;
}

export default function ExportButton({ headers, rows, jsonData, filenameBase }: Props) {
  const [open, setOpen] = useState(false);

  const timestamp = new Date().toISOString().slice(0, 10);
  const basename = `${filenameBase}-${timestamp}`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium px-3 py-2 rounded-lg border border-gray-700 transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        Export
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden min-w-[120px]">
            <button
              onClick={() => {
                exportCsv(headers, rows, `${basename}.csv`);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={() => {
                exportJson(jsonData, `${basename}.json`);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-gray-700 transition-colors border-t border-gray-700"
            >
              Export JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}
