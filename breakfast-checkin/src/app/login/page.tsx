import LoginForm from "@/frontend/views/login/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-[#e8efe5] flex items-center justify-center mb-4">
        <span className="text-2xl"></span>
      </div>
      <h1 className="text-2xl font-semibold text-[#2d2d2d] mb-1">Breakfast Check-In</h1>
      <p className="text-sm text-[#6b6b6b] mb-8">Sign in to manage breakfast access</p>
      <LoginForm />
    </div>
  );
}
