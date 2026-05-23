'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Lock, Eye, EyeOff, ArrowLeft, BarChart3, FileText, Target, Bell, GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';
import { ApiRequestError, apiForgotPassword, apiHealth, apiVerifyOtp } from '@/lib/api';
import { toast } from 'sonner';

export default function StudentLoginPage() {
  const [usn, setUsn] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();

  // Forgot Password Modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotUsn, setForgotUsn] = useState('');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'student') {
      router.replace('/student/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await login(usn, password, 'student');
    
    if (success) {
      toast.success('Login successful! Redirecting...');
      router.replace('/student/dashboard');
    } else {
      toast.error('Invalid credentials. Please try again.');
    }
    
    setIsSubmitting(false);
  };

  const handleForgotPasswordStep1 = async () => {
    const resetUsn = forgotUsn.trim().toUpperCase();
    if (!resetUsn) {
      toast.error('Please enter your USN');
      return;
    }
    setForgotLoading(true);
    try {
      await apiForgotPassword({ usn: resetUsn });
      setForgotIdentifier(resetUsn);
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
    setForgotUsn('');
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
      {/* Left Side - Animated gradient */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12" 
           style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #2563EB 50%, #7C3AED 100%)' }}>
        {/* Animated overlay circles */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-xl animate-blob" />
          <div className="absolute bottom-40 left-20 w-60 h-60 bg-white/5 rounded-full blur-2xl animate-blob animation-delay-2000" />
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <GraduationCap className="w-8 h-8 text-white" />
          <span className="text-white font-bold text-xl">FaceAttend</span>
        </Link>

        {/* Center content */}
        <div className="relative z-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Student Portal</h2>
          <p className="text-white/80 mb-8">Track your attendance, marks and CGPA in real time</p>
          
          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="glass-card p-4 text-left">
              <BarChart3 className="w-6 h-6 text-white mb-2" />
              <p className="text-white text-sm font-medium">Live Attendance Tracking</p>
            </div>
            <div className="glass-card p-4 text-left">
              <FileText className="w-6 h-6 text-white mb-2" />
              <p className="text-white text-sm font-medium">CIE & SEE Marks</p>
            </div>
            <div className="glass-card p-4 text-left">
              <Target className="w-6 h-6 text-white mb-2" />
              <p className="text-white text-sm font-medium">CGPA Calculator</p>
            </div>
            <div className="glass-card p-4 text-left">
              <Bell className="w-6 h-6 text-white mb-2" />
              <p className="text-white text-sm font-medium">Instant Notifications</p>
            </div>
          </div>
        </div>

        {/* SDG badge */}
        <div className="relative z-10">
          <p className="text-white/80 text-sm">SDG 4: Quality Education 🌍</p>
        </div>
      </div>

      {/* Right Side - White login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#1E293B] mb-2">Welcome Back</h1>
            <p className="text-[#64748B]">Student portal</p>
          </div>
          
          <div className="w-full h-px bg-[#E2E8F0] mb-6" />

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* USN Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1E293B]">University Seat Number</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <Input
                  type="text"
                  placeholder="Your USN"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value.toUpperCase())}
                  className="pl-10 h-12 rounded-xl border-[#E2E8F0] focus:border-[#7C3AED] focus:ring-[#7C3AED] uppercase"
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
                  className="pl-10 pr-10 h-12 rounded-xl border-[#E2E8F0] focus:border-[#7C3AED] focus:ring-[#7C3AED]"
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
                className="inline-flex min-h-11 items-center text-sm text-[#7C3AED] hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white font-medium"
            >
              {isSubmitting ? 'Logging in...' : 'Login to Student Portal →'}
            </Button>
          </form>

          {/* Login note */}
          <div className="p-4 rounded-xl bg-[#7C3AED]/5 border border-[#7C3AED]/20">
            <p className="text-sm text-[#64748B] leading-relaxed">
              Enter your University Seat Number (USN) and the password provided by your college.
              You can only view your own attendance and marks.
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
            // Step 1: USN input
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B] dark:text-[#f1f5f9]">USN</label>
                <Input
                  type="text"
                  placeholder="Enter your USN"
                  value={forgotUsn}
                  onChange={(e) => setForgotUsn(e.target.value.toUpperCase())}
                  className="rounded-lg border-[#E2E8F0] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] focus:border-[#7C3AED] focus:ring-[#7C3AED] uppercase"
                />
              </div>
              <Button
                onClick={handleForgotPasswordStep1}
                disabled={forgotLoading}
                className="w-full bg-[#7C3AED] hover:bg-[#6D28D9]"
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
                  className="rounded-lg border-[#E2E8F0] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B] dark:text-[#f1f5f9]">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="rounded-lg border-[#E2E8F0] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B] dark:text-[#f1f5f9]">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  className="rounded-lg border-[#E2E8F0] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>
              <Button
                onClick={handleForgotPasswordStep2}
                disabled={forgotLoading}
                className="w-full bg-[#7C3AED] hover:bg-[#6D28D9]"
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
