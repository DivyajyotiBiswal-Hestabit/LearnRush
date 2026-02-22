"use client";

import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function SignIn() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-900 via-slate-700 to-black">
      
      {/* Soft glow background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-indigo-600/20 blur-3xl rounded-full" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-purple-600/20 blur-3xl rounded-full" />
      </div>

      <Card className="w-[800px] p-120 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-black">Welcome back</h1>
          <p className="text-black-300 mt-2 text-lg">
            Sign in to continue to your dashboard
          </p>
          
        </div>

        {/* Form */}
        <div className="space-y-3">
          <Input className="h-14 text-lg" placeholder="Email address" />
          <Input className="h-14 text-lg" type="password" placeholder="Password" />
        </div>

        {/* Forgot password */}
        <div className="flex justify-end text-l">
          <Link href="#" className="text-indigo-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        {/* Button */}
        <Button className="w-full h-14 text-lg font-semibold">
          Sign In
        </Button>

        {/* Footer */}
        <p className="text-center text-gray-800">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-indigo-600 hover:underline">
            Sign up
          </Link>
        </p>

      </Card>
    </div>
  );
}