import { useState } from 'react';
import { auth } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

function Auth({ onLoginSuccess, darkMode }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const bgMain = darkMode ? 'bg-[#0a0a1a]' : 'bg-gray-50';
  const textMain = darkMode ? 'text-white' : 'text-gray-900';
  const cardBg = darkMode ? 'bg-white/5' : 'bg-white';
  const cardBorder = darkMode ? 'border-white/10' : 'border-gray-200';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userCredential;
      if (isSignup) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      const token = await userCredential.user.getIdToken();
      onLoginSuccess(token, userCredential.user);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Yeh email already registered hai. Login try karo.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Email ya password galat hai.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password kam se kam 6 characters ka hona chahiye.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email sahi format mein nahi hai.');
      } else {
        setError('Kuch gadbad ho gayi. Dobara try karo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${bgMain} ${textMain} flex items-center justify-center relative overflow-hidden transition-colors duration-300`}>
      {darkMode && (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-[120px] pointer-events-none" />
        </>
      )}

      <div className={`relative z-10 w-full max-w-sm mx-4 ${cardBg} border ${cardBorder} rounded-2xl p-8 backdrop-blur-sm`}>
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm">
            🤖
          </div>
          <span className="font-bold text-lg">Persona AI</span>
        </div>

        <h2 className="text-xl font-bold text-center mb-1">
          {isSignup ? 'Account Banao' : 'Login '}
        </h2>
        <p className={`text-sm text-center ${textSecondary} mb-6`}>
          {isSignup ? 'Naya account banao chatting shuru karne ke liye' : 'Welcome Back'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`text-xs ${textSecondary} block mb-1`}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tumhara@email.com"
              className={`w-full ${cardBg} border ${cardBorder} rounded-xl px-4 py-2.5 text-sm ${textMain} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
            />
          </div>

          <div>
            <label className={`text-xs ${textSecondary} block mb-1`}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className={`w-full ${cardBg} border ${cardBorder} rounded-xl px-4 py-2.5 text-sm ${textMain} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Wait karo...' : isSignup ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <p className={`text-center text-sm ${textSecondary} mt-6`}>
          {isSignup ? 'Already account hai?' : 'Naye ho?'}{' '}
          <button
            onClick={() => { setIsSignup(!isSignup); setError(''); }}
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            {isSignup ? 'Login karo' : 'Sign up '}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;
