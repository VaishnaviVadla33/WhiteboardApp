import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth, db } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { Mail, Lock, User, LogIn, Eye, EyeOff } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    if (!email || !password || (isSignUp && !name)) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Create user account
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update profile
        await updateProfile(cred.user, { displayName: name });
        
        // Create user document in Firestore for search functionality
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          email: email.toLowerCase(),
          displayName: name,
          createdAt: Date.now(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-3 md:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm md:max-w-md p-6 md:p-8 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <LogIn className="text-white" size={28} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1 md:mt-2">
            {isSignUp
              ? "Sign up to start collaborating"
              : "Sign in to your whiteboard"}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-3 md:space-y-4"
        >
          {isSignUp && (
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-gray-400" />
                  Full Name
                </div>
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm md:text-base"
              />
            </div>
          )}

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-gray-400" />
                Email Address
              </div>
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm md:text-base"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-gray-400" />
                Password
              </div>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm md:text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 md:top-3.5 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs md:text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 md:py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
          >
            {loading
              ? isSignUp
                ? "Creating Account..."
                : "Signing In..."
              : isSignUp
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

        {/* Toggle Sign Up / Login */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
        >
          {isSignUp ? "Sign In Instead" : "Create an Account"}
        </button>
      </div>
    </div>
  );
}