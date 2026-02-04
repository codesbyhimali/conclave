"use client";

import { useState, useEffect } from "react";
import { Zap, Clock, Sparkles } from "lucide-react";
import { formatTimeRemaining } from "@/lib/utils";
import { LIMITS } from "@/lib/types";

interface CreditDisplayProps {
  credits: number;
  resetAt: string | null;
  onUpgradeClick: () => void;
}

export default function CreditDisplay({
  credits,
  resetAt,
  onUpgradeClick,
}: CreditDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(resetAt));

  useEffect(() => {
    if (!resetAt || credits > 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(resetAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [resetAt, credits]);

  const isExhausted = credits === 0;

  return (
    <div
      className={`rounded-lg p-4 ${
        isExhausted ? "bg-amber-50 border border-amber-200" : "bg-primary-50 border border-primary-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${
              isExhausted ? "bg-amber-100" : "bg-primary-100"
            }`}
          >
            <Zap
              className={`w-5 h-5 ${
                isExhausted ? "text-amber-600" : "text-primary-600"
              }`}
            />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {credits} / {LIMITS.AUTHENTICATED_CREDITS} credits
            </p>
            {isExhausted && resetAt && (
              <div className="flex items-center gap-1 text-sm text-amber-700">
                <Clock className="w-3.5 h-3.5" />
                <span>{timeRemaining}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onUpgradeClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          Upgrade
        </button>
      </div>
    </div>
  );
}
