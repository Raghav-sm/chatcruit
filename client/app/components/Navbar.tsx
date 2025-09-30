// app/components/Navbar.tsx
import { UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { MessageSquare, Users, Briefcase } from "lucide-react";

interface NavbarProps {
  isSignedIn?: boolean;
}

export default function Navbar({ isSignedIn = false }: NavbarProps) {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
      <div className="bg-black/40 backdrop-blur-xl border border-gray-800/50 rounded-4xl shadow-2xl shadow-black/20">
        <div className="px-6 sm:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-black" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-gray-600 rounded-full"></div>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white">ChatCruit</h1>
            </div>

            {isSignedIn ? (
              <div className="flex items-center gap-4">
                <UserButton />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <SignInButton>
                  <button className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-4 py-2">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="bg-white text-black hover:bg-gray-200 rounded-2xl font-medium text-sm px-6 py-3 transition-all transform hover:scale-105">
                    Get Started
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
