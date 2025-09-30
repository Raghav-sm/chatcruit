// app/components/LandingPage.tsx
import { SignUpButton } from "@clerk/nextjs";
import Navbar from "./Navbar";
import {
  FileText,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  Star,
  Award,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar isSignedIn={false} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 space-y-8">
            <div className="space-y-6 mt-12">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Chatcruit
                <span className="block text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                  Hire Smarter,Not Harder
                </span>
              </h1>

              <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
                Transform your hiring process with AI that analyzes resumes,
                evaluates candidates, and provides intelligent insights to help
                you find the perfect fit.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <SignUpButton>
                <button className="bg-white text-black hover:bg-gray-200 rounded-xl font-semibold text-lg px-8 py-4 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Start Free Trial
                </button>
              </SignUpButton>
              <button className="border border-gray-700 text-white hover:border-gray-400 hover:bg-gray-900 rounded-xl font-semibold text-lg px-8 py-4 transition-all">
                Watch Demo
              </button>
            </div>

            <div className="flex flex-wrap gap-8 pt-8">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-white" />
                <div>
                  <div className="text-2xl font-bold">95%</div>
                  <div className="text-sm text-gray-400">Accuracy Rate</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-white" />
                <div>
                  <div className="text-2xl font-bold">50K+</div>
                  <div className="text-sm text-gray-400">Resumes Analyzed</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="bg-white rounded-2xl shadow-2xl p-6 text-gray-900 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="space-y-6">
                  <div className="border-b-2 border-gray-300 pb-4">
                    <h2 className="text-2xl font-bold text-black">
                      Sarah Johnson
                    </h2>
                    <p className="text-gray-700 font-medium">
                      Senior Product Designer
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      5+ years experience • San Francisco, CA
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-black mb-3">
                      Top Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Figma",
                        "UI/UX Design",
                        "Prototyping",
                        "Design Systems",
                        "User Research",
                      ].map((skill) => (
                        <span
                          key={skill}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm border border-gray-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-black mb-3">
                      Experience
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="font-medium">Lead Designer</span>
                          <span className="text-sm text-gray-600">
                            2020-Present
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">TechCorp Inc.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-gray-800 to-black text-white p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-semibold">AI Score: 92/100</span>
                    </div>
                    <p className="text-sm mt-1 opacity-90">
                      Excellent cultural fit
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-gray-800 text-white p-3 rounded-xl shadow-lg border border-gray-700">
                <FileText className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-gray-800 text-white p-3 rounded-xl shadow-lg border border-gray-700">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Powerful Features for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              Modern Hiring
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Everything you need to streamline your recruitment process and make
            data-driven hiring decisions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: FileText,
              title: "Smart Resume Analysis",
              description:
                "Extract key insights, skills, and experience automatically from any resume format",
            },
            {
              icon: MessageSquare,
              title: "AI Chat Assistant",
              description:
                "Get instant answers about candidates and their qualifications through natural conversation",
            },
            {
              icon: TrendingUp,
              title: "Candidate Ranking",
              description:
                "Intelligently rank candidates based on job requirements and cultural fit",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-black border border-gray-800 rounded-2xl p-8 transition-all hover:shadow-2xl hover:shadow-gray-900/50 hover:border-gray-700"
            >
              <div className="w-12 h-12 border-2 border-white rounded-lg flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
