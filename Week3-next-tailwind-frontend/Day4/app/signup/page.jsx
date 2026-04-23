import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function SignUp() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 text-black overflow-hidden">

      {/* Background gradient */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-slate-900 via-slate-700 to-black" />

      {/* Glow effect */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-indigo-800/20 blur-3xl rounded-full -z-10" />

      <Card className="w-full max-w-lg p-10 space-y-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl">

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="text-black-800 text-sm">
            Start managing your store smarter today
          </p>
        </div>

        <div className="text-black space-y-4">
          <Input  placeholder="Full name" />
          <Input className="text-black" placeholder="Email address" />
          <Input className="text-black" placeholder="Password" type="password" />
        </div>

        <Button className="w-full py-3 text-lg">
          Sign Up
        </Button>

        <p className="text-center text-sm text-black-800">
          Already have an account?{" "}
          <Link href="/signin" className="text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>

      </Card>
    </div>
  );
}