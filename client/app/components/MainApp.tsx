// app/components/MainApp.tsx
"use client";
import { useState } from "react";
import { Upload, FileText, X, CheckCircle2, MessageSquare } from "lucide-react";
import Navbar from "./Navbar";

export default function MainApp() {
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (file: File) => {
    if (file && file.type === "application/pdf") {
      setUploadedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(2) + " KB",
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar isSignedIn={true} />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Section */}
        <div className="w-[30%] border-r border-gray-800 flex flex-col">
          <div className="flex-1 p-6 flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Upload Resume</h2>
              <p className="text-sm text-gray-400">
                Upload a candidate's resume to begin the analysis
              </p>
            </div>

            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                flex-1 border-2 border-dashed rounded-xl
                flex flex-col items-center justify-center
                transition-all cursor-pointer
                ${
                  isDragging
                    ? "border-white bg-white/10"
                    : "border-gray-800 hover:border-gray-600 hover:bg-gray-900/50"
                }
              `}
            >
              {!uploadedFile ? (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-8">
                  <Upload className="w-16 h-16 mb-4 text-gray-500" />
                  <p className="text-lg font-medium mb-2 text-center">
                    Drop your PDF here, or{" "}
                    <span className="text-white underline">browse</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF files only • Max 10MB
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="w-full p-6">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-10 h-10 text-white" />
                        <div>
                          <p className="text-sm font-medium">
                            {uploadedFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {uploadedFile.size}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={removeFile}
                        className="text-gray-500 hover:text-white transition-colors p-1"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">Uploaded successfully</span>
                    </div>
                  </div>

                  <label className="mt-4 block">
                    <button className="w-full py-3 px-4 bg-white text-black hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors border border-white">
                      Upload Another Resume
                    </button>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-[70%] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="w-24 h-24 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-800">
              <MessageSquare className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-lg font-medium text-white">Chat Interface</p>
            <p className="text-sm mt-2">
              Upload a resume to start chatting with AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
