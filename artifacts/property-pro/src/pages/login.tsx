import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLogin } from "@workspace/api-client-react";
import wiseworxLogo from "@assets/wiseworxlogo_1774862605471.png";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const { login } = useAuth();
  
  const { mutate: doLogin, isPending } = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.user);
      },
      onError: (error) => {
        setErrorMsg(error.message || "Invalid email or password");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email || !password) {
      setErrorMsg("Please fill in all fields");
      return;
    }
    doLogin({ data: { email, password } });
  };

  return (
    <div className="min-h-screen w-full flex bg-background relative overflow-hidden">
      {/* Background Image Area */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
        <img 
          src={`${import.meta.env.BASE_URL}images/login-bg.png`}
          alt="Luxury Property Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-12 left-12 z-20 max-w-md">
          <h2 className="text-4xl font-display font-bold text-white mb-4 drop-shadow-lg">
            Elevate Your Property Portfolio
          </h2>
          <p className="text-lg text-white/80 drop-shadow">
            The enterprise-grade management platform built for modern real estate professionals.
          </p>
        </div>
      </div>

      {/* Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative z-20">
        {/* Mobile background blurs */}
        <div className="absolute top-1/4 -right-20 w-72 h-72 bg-primary/20 rounded-full blur-[100px] lg:hidden" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-accent/20 rounded-full blur-[100px] lg:hidden" />

        <div className="w-full max-w-md space-y-10">
          <div className="text-center sm:text-left">
            <div className="inline-block bg-white rounded-xl px-4 py-2.5 shadow-md mb-8 mx-auto sm:mx-0">
              <img src={wiseworxLogo} alt="Wiseworx Logo" className="h-10 object-contain" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground">Welcome back</h1>
            <p className="mt-2 text-muted-foreground">Sign in to your account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in slide-in-from-top-2">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border-2 border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-white/10 transition-all"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <a href="#" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border-2 border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-white/10 transition-all"
                    placeholder="Enter your password"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isPending}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-primary-foreground",
                "bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20",
                "transition-all duration-200 active:scale-[0.98]",
                isPending && "opacity-70 cursor-not-allowed"
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <div className="text-center text-sm text-muted-foreground mt-8">
              <p className="font-medium mb-1">Demo Credentials:</p>
              <p>owner@propertypro.com | admin@propertypro.com</p>
              <p>tenant@propertypro.com | vendor@propertypro.com</p>
              <p className="mt-1 opacity-70">Password: role + 123 (e.g. owner123)</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
