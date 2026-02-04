"use client";

import { useState } from "react";
import { Copy, Check, FileText, Image as ImageIcon } from "lucide-react";

interface ResultsDisplayProps {
  text: string;
  diagrams: string[];
}

export default function ResultsDisplay({ text, diagrams }: ResultsDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Extracted Text</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <div className="p-4">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
            {text || "No text extracted."}
          </pre>
        </div>
      </div>

      {diagrams.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
            <ImageIcon className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">
              Detected Diagrams ({diagrams.length})
            </span>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {diagrams.map((diagram, i) => (
              <a
                key={i}
                href={diagram}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all"
              >
                <img
                  src={diagram}
                  alt={`Diagram ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
