"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import CreditDisplay from "@/components/CreditDisplay";
import ResultsDisplay from "@/components/ResultsDisplay";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, Sparkles, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface AccessStatus {
  allowed: boolean;
  reason?: string;
  credits?: number;
  resetAt?: string | null;
  requiresAuth?: boolean;
}

interface ProcessResult {
  text: string;
  diagrams: string[];
}

export default function ConvertPage() {
  const [user, setUser] = useState<User | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const checkAccess = useCallback(async () => {
    try {
      const response = await fetch("/api/access/check");
      const data = await response.json();
      setAccessStatus(data);
    } catch {
      setError("Failed to check access status");
    }
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      checkAccess();
    });

    checkAccess();

    return () => subscription.unsubscribe();
  }, [supabase.auth, checkAccess]);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setError(null);
    setResult(null);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setError(null);

    // Create a 60-second safety timeout
    const timeoutId = setTimeout(() => {
      console.error("Processing timeout reached (60s)");
      setError("Processing is taking too long. Please try with smaller files or fewer pages.");
      setProcessing(false);
    }, 60000);

    try {
      console.log("Starting file processing...");
      
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresAuth) {
          console.log("Authentication required, redirecting to login");
          router.push("/login");
          return;
        }
        
        // Display detailed error message
        const errorMsg = data.error || "Processing failed";
        const detailsMsg = data.details ? `\n\n[Debug Info]: ${data.details}` : "";
        console.error("Processing error:", errorMsg, data.details);
        
        throw new Error(errorMsg + detailsMsg);
      }

      console.log("Processing completed successfully");
      setResult(data);
      setFiles([]);
      checkAccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("Error during processing:", errorMessage);
      setError(errorMessage);
    } finally {
      clearTimeout(timeoutId);
      setProcessing(false);
    }
  };

  const handleUpgradeClick = async () => {
    setShowUpgradeModal(true);

    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "upgrade_click" }),
    });
  };

  const isDisabled =
    !accessStatus?.allowed || (accessStatus.credits === 0 && !!user);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Handwriting to Text
          </h1>
          <p className="text-gray-600">
            Upload images or PDFs of handwritten content to extract text
          </p>
        </div>

        {accessStatus?.requiresAuth && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-medium">
                Free trial used
              </p>
              <p className="text-amber-700 text-sm mt-1">
                You&apos;ve used your free trial.{" "}
                <button
                  onClick={() => router.push("/login")}
                  className="underline font-medium hover:text-amber-900"
                >
                  Sign in or create an account
                </button>{" "}
                to get 3 free credits every 24 hours.
              </p>
            </div>
          </div>
        )}

        {user && accessStatus && (
          <div className="mb-6">
            <CreditDisplay
              credits={accessStatus.credits ?? 0}
              resetAt={accessStatus.resetAt ?? null}
              onUpgradeClick={handleUpgradeClick}
            />
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <div className="space-y-6">
          <UploadZone
            onFilesSelected={handleFilesSelected}
            disabled={isDisabled}
          />

          {files.length > 0 && (
            <button
              onClick={handleProcess}
              disabled={processing || isDisabled}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Convert to Text"
              )}
            </button>
          )}

          {result && (
            <ResultsDisplay text={result.text} diagrams={result.diagrams} />
          )}
        </div>
      </main>

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                COMING SOON…
              </h2>
              <p className="text-gray-600">
                Premium plans with unlimited credits are on the way. Stay tuned!
              </p>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
