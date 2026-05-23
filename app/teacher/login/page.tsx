'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Video, BarChart3, FileText, GraduationCap, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';
import { ApiRequestError, apiForgotPassword, apiHealth, apiVerifyOtp } from '@/lib/api';
import { toast } from 'sonner';

export default function TeacherLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();

  // Forgot Password Modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'teacher') {
      router.replace('/teacher/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await login(email, password, 'teacher');
    
    if (success) {
      toast.success('Login successful! Redirecting...');
      router.replace('/teacher/dashboard');
    } else {
      toast.error('Invalid credentials. Please try again.');
    }
    
    setIsSubmitting(false);
  };

  const handleForgotPasswordStep1 = async () => {
    const resetEmail = forgotEmail.trim().toLowerCase();
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }
    setForgotLoading(true);
    try {
      await apiForgotPassword({ email: resetEmail });
      setForgotIdentifier(resetEmail);
      toast.success('OTP sent to your email');
      setForgotStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const clearForgotPasswordFields = () => {
    setForgotStep(1);
    setForgotEmail('');
    setForgotIdentifier('');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
  };

  const handleForgotPasswordStep2 = async () => {
    if (!forgotOtp.trim() || !forgotNewPassword.trim() || !forgotConfirmPassword.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setForgotLoading(true);
    try {
      const backendReachable = await apiHealth();
      if (!backendReachable) {
        toast.error('Backend server is not running. Please contact administrator.');
        return;
      }

      const res = await apiVerifyOtp({
        email_or_usn: forgotIdentifier,
        otp: forgotOtp.trim(),
        new_password: forgotNewPassword,
      });
      if (res.success !== true) {
        throw new Error(res.message || 'Failed to reset password');
      }
      toast.success('Password reset successfully!');
      setForgotOpen(false);
      clearForgotPasswordFields();
    } catch (err) {
      if (err instanceof ApiRequestError && err.isNetworkError) {
        toast.error('Cannot connect to server. Make sure backend is running.');
      } else if (err instanceof ApiRequestError && err.status === 400) {
        toast.error('Invalid or expired OTP. Please request a new one.');
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to reset password');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const openForgotPasswordModal = () => {
    clearForgotPasswordFields();
    setForgotOpen(true);
  };

  const closeForgotPasswordModal = () => {
    setForgotOpen(false);
    clearForgotPasswordFields();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Dark with animation */}
      <div className="hidden lg:flex lg:w-[55%] bg-[#0F172A] relative overflow-hidden flex-col justify-between p-12">
        {/* Animated rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-64 h-64 border border-[#2563EB]/20 rounded-full animate-pulse" />
          <div className="absolute w-96 h-96 border border-[#2563EB]/10 rounded-full animate-pulse animation-delay-2000" />
          <div className="absolute w-[32rem] h-[32rem] border border-[#7C3AED]/10 rounded-full animate-pulse animation-delay-4000" />
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <GraduationCap className="w-8 h-8 text-[#2563EB]" />
          <span className="text-white font-bold text-xl">FaceAttend</span>
        </Link>

        {/* Center content */}
        <div className="relative z-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Welcome Back, Professor</h2>
          <p className="text-gray-400 mb-8">Manage attendance and marks for your assigned subject</p>
          
          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm">
              <Video className="w-4 h-4 text-[#2563EB]" />
              Face Recognition
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm">
              <BarChart3 className="w-4 h-4 text-[#10B981]" />
              Analytics
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm">
              <FileText className="w-4 h-4 text-[#7C3AED]" />
              Reports
            </div>
          </div>
        </div>

        {/* SDG badges */}
        <div className="flex gap-4 relative z-10">
          <div className="px-3 py-1.5 rounded-full bg-[#2563EB]/20 border border-[#2563EB]/30 text-white text-xs">
            SDG 4: Quality Education
          </div>
          <div className="px-3 py-1.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-white text-xs">
            SDG 9: Innovation
          </div>
        </div>
      </div>

      {/* Right Side - White login form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-[#1E293B] mb-2">Teacher Login</h1>
          <p className="text-[#64748B] mb-6">Teacher portal</p>
          
          <div className="w-full h-px bg-[#E2E8F0] mb-6" />

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1E293B]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <Input
                  type="email"
                  placeholder="Your college email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-[#E2E8F0] focus:border-[#2563EB] focus:ring-[#2563EB]"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1E293B]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl border-[#E2E8F0] focus:border-[#2563EB] focus:ring-[#2563EB]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-[#64748B] hover:text-[#1E293B]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label htmlFor="remember" className="text-sm text-[#64748B]">Remember me</label>
              </div>
              <button
                type="button"
                onClick={openForgotPasswordModal}
                className="inline-flex min-h-11 items-center text-sm text-[#2563EB] hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white font-medium"
            >
              {isSubmitting ? 'Logging in...' : 'Login to Teacher Portal →'}
            </Button>
          </form>

          {/* Login note */}
          <div className="p-4 rounded-xl bg-[#2563EB]/5 border border-[#2563EB]/20">
            <p className="text-sm text-[#64748B] leading-relaxed">
              Use your official college email and the password provided by the administration.
              Each teacher can only access data for their assigned subject.
            </p>
          </div>

          {/* Back to home */}
          <Link 
            href="/" 
            className="flex items-center gap-2 justify-center mt-6 text-[#64748B] hover:text-[#1E293B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={forgotOpen} onOpenChange={closeForgotPasswordModal}>
        <DialogContent className="sm:max-w-md dark:bg-[#1e293b] dark:border-[#334155] dark:text-[#f1f5f9]">
          <DialogHeader>
            <DialogTitle className="dark:text-[#f1f5f9]">
              {forgotStep === 1 ? 'Reset Password' : 'Verify OTP'}
            </DialogTitle>
          </DialogHeader>

          {forgotStep === 1 ? (
            // Step 1: Email input
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B] dark:text-[#f1f5f9]">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="rounded-lg border-[#E2E8F0] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] focus:border-[#2563EB] focus:ring-[#2563EB]"
                />
              </div>
              <Button
                onClick={handleForgotPasswordStep1}
                disabled={forgotLoading}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]"
              >
                {forgotLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </div>
          ) : (
            // Step 2: OTP and password inputs
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B] dark:text-[#f1f5f9]">OTP</label>
                <Input
                  type="text"
                  placeholder="Enter OTP from email"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  className="rounded-lg border-[#E2E8F0] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] focus:border-[#2563EB] focus:ring-[#2563EB]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B] dark:text-[#f1f5f9]">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="rounded-lg border-[#E2E8F0] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] focus:border-[#2563EB] focus:ring-[#2563EB]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B] dark:text-[#f1f5f9]">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  className="rounded-lg border-[#E2E8F0] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] focus:border-[#2563EB] focus:ring-[#2563EB]"
                />
              </div>
              <Button
                onClick={handleForgotPasswordStep2}
                disabled={forgotLoading}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]"
              >
                {forgotLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setForgotStep(1)}
                className="w-full"
              >
                Back
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
