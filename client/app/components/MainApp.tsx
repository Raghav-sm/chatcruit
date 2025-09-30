// app/components/MainApp.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  MessageSquare,
  Send,
  Bot,
  User,
} from "lucide-react";
import Navbar from "./Navbar";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sources?: string[];
}

interface UploadedFile {
  name: string;
  size: string;
}

export default function MainApp() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (file: File) => {
    if (file && file.type === "application/pdf") {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("files", file);

      try {
        const response = await fetch("http://localhost:5000/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          setUploadedFile({
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + " MB",
          });
          setMessages([]); // Clear previous messages when new file is uploaded
          console.log("Upload successful:", result);
        } else {
          const error = await response.json();
          alert(`Upload failed: ${error.error}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
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
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: inputMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.answer,
          role: "assistant",
          timestamp: new Date(),
          sources: data.sources,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const error = await response.json();
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Error: ${error.error}`,
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Failed to get response. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar isSignedIn={true} />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Section */}
        <div className="w-[30%] border-r border-gray-800 flex flex-col">
          <div className="flex-1 p-6 flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">
                Upload HR Documents
              </h2>
              <p className="text-sm text-gray-400">
                Upload HR policy PDFs to build your knowledge base
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
                ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {!uploadedFile ? (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-8">
                  <Upload className="w-16 h-16 mb-4 text-gray-500" />
                  <p className="text-lg font-medium mb-2 text-center">
                    {isUploading
                      ? "Uploading..."
                      : "Drop your PDF here, or browse"}
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF files only • Max 10MB
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={isUploading}
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
                        disabled={isUploading}
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
                    <button className="w-full py-3 px-4 bg-white text-black hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors border border-white disabled:opacity-50">
                      Upload Another Document
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

        {/* Right Section - Chat */}
        <div className="w-[70%] flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 h-full flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-800">
                  <MessageSquare className="w-10 h-10 text-gray-600" />
                </div>
                <p className="text-lg font-medium text-white">
                  HR Policy Assistant
                </p>
                <p className="text-sm mt-2">
                  {uploadedFile
                    ? "Ask questions about the HR policies you've uploaded"
                    : "Upload HR documents to start chatting"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        message.role === "user"
                          ? "bg-white text-black"
                          : "bg-gray-900 text-white border border-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {message.role === "user" ? (
                          <>
                            <User className="w-4 h-4" />
                            <span className="text-sm font-medium">You</span>
                          </>
                        ) : (
                          <>
                            <Bot className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              HR Assistant
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>

                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <p className="text-xs text-gray-400 mb-2">Sources:</p>
                          <div className="space-y-1">
                            {message.sources
                              .slice(0, 2)
                              .map((source, index) => (
                                <div
                                  key={index}
                                  className="text-xs text-gray-500 bg-gray-800 rounded px-2 py-1"
                                >
                                  {source.substring(0, 150)}...
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl p-4 bg-gray-900 text-white border border-gray-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          HR Assistant
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input */}
          {uploadedFile && (
            <div className="border-t border-gray-800 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about HR policies, benefits, procedures..."
                  className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-white text-black hover:bg-gray-200 rounded-xl px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
