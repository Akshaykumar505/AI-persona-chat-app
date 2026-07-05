import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Auth from './Auth';

function App() {
  const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY;
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [personas, setPersonas] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Firebase auth state listener
  // Admin bypass check (URL mein ?admin=KEY daalne se login skip ho jayega)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const keyFromUrl = params.get('admin');
    if (keyFromUrl && keyFromUrl === ADMIN_KEY) {
      setIsAdmin(true);
      setAuthLoading(false);
    }
  }, []);

  // Firebase auth state listener
  useEffect(() => {
    if (isAdmin) return;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const token = await currentUser.getIdToken();
        setUser(currentUser);
        setAuthToken(token);
      } else {
        setUser(null);
        setAuthToken(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    fetch('http://localhost:5000/api/personas')
      .then((res) => res.json())
      .then((data) => setPersonas(data))
      .catch((err) => console.error('Error fetching personas:', err));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'hi-IN';
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + transcript);
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const handleLoginSuccess = (token, currentUser) => {
    setAuthToken(token);
    setUser(currentUser);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setSelectedPersona(null);
    setMessages([]);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Voice input tumhare browser mein supported nahi hai. Chrome try karo.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text) => {
    if (!voiceEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  };

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const sendMessage = async (textToSend) => {
    const messageText = textToSend !== undefined ? textToSend : input;
    if (!messageText.trim() || !selectedPersona) return;

    const newMessages = [...messages, { role: 'user', content: messageText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (isAdmin) {
        headers['x-admin-key'] = ADMIN_KEY;
      } else {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ persona: selectedPersona.id, messages: newMessages }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
        speakText(data.reply);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: 'Error: kuch gadbad ho gayi.' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'assistant', content: 'Error: server se connect nahi ho paya.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => sendMessage();

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const goBack = () => {
    setSelectedPersona(null);
    setMessages([]);
    window.speechSynthesis.cancel();
  };

  const clearChat = () => {
    if (messages.length === 0) return;
    const confirmed = window.confirm('Poori chat clear kar dein?');
    if (confirmed) {
      setMessages([]);
      window.speechSynthesis.cancel();
    }
  };

  const suggestedPrompts = selectedPersona?.id === 'hitesh'
    ? ['DSA konsi language se seekhein?', 'Web dev kaise start karein?', 'Fundamentals kaise strong karein?']
    : ['System design kaise seekhein?', 'Docker kya hai?', 'Full-stack roadmap batao'];

  const bgMain = darkMode ? 'bg-[#0a0a1a]' : 'bg-gray-50';
  const textMain = darkMode ? 'text-white' : 'text-gray-900';
  const cardBg = darkMode ? 'bg-white/5' : 'bg-white';
  const cardBorder = darkMode ? 'border-white/10' : 'border-gray-200';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const textTertiary = darkMode ? 'text-gray-300' : 'text-gray-600';

  const ThemeToggle = ({ className = '' }) => (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className={`w-10 h-10 shrink-0 rounded-full border flex items-center justify-center transition ${
        darkMode
          ? 'bg-white/5 border-white/10 hover:bg-white/10 text-yellow-300'
          : 'bg-white border-gray-200 hover:bg-gray-100 shadow-sm text-slate-600'
      } ${className}`}
      title={darkMode ? 'Light mode mein switch karo' : 'Dark mode mein switch karo'}
    >
      {darkMode ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 3a1 1 0 011 1v1a1 1 0 11-2 0V4a1 1 0 011-1zm0 15a5 5 0 100-10 5 5 0 000 10zm8-6a1 1 0 010 2h-1a1 1 0 110-2h1zM4 12a1 1 0 010 2H3a1 1 0 110-2h1zm14.95-6.95a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM7.05 16.95a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM12 20a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm6.243-1.343a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM4.929 4.929a1 1 0 011.414 0l.707.707A1 1 0 115.636 7.05l-.707-.707a1 1 0 010-1.414z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  );

  // ---------- Auth Loading ----------
  if (authLoading) {
    return (
      <div className={`min-h-screen ${bgMain} ${textMain} flex items-center justify-center`}>
        <p className={textSecondary}>Loading...</p>
      </div>
    );
  }

  // ---------- Not Logged In ----------
  // ---------- Not Logged In ----------
  if (!user && !isAdmin) {
    return <Auth onLoginSuccess={handleLoginSuccess} darkMode={darkMode} />;
  }

  // ---------- Landing / Persona Selection Screen ----------
  if (!selectedPersona) {
    return (
      <div className={`min-h-screen ${bgMain} ${textMain} overflow-x-hidden relative transition-colors duration-300`}>
        {darkMode ? (
          <>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-40 right-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-[120px] pointer-events-none" />
          </>
        ) : (
          <>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-40 right-1/4 w-96 h-96 bg-blue-200/40 rounded-full blur-[120px] pointer-events-none" />
          </>
        )}

        <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm">
              🤖
            </div>
            <span className="font-bold text-lg">Persona AI</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`hidden md:flex gap-8 text-sm ${textTertiary}`}>
              <a href="#personas" className="hover:opacity-70 transition">Personas</a>
              <a href="#features" className="hover:opacity-70 transition">Features</a>
            </div>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className={`text-sm px-3 py-2 rounded-full border ${cardBorder} ${textSecondary} hover:bg-white/10 transition`}
            >
              Logout
            </button>
          </div>
        </nav>

        <div className="relative z-10 max-w-3xl mx-auto text-center px-6 pt-16 pb-20">
          <span className={`inline-block ${cardBg} border ${cardBorder} rounded-full px-4 py-1 text-xs ${textTertiary} mb-6`}>
            2 Unique Personalities. Infinite Conversations.
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
            Chat with{' '}
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              AI Coding Mentors
            </span>
          </h1>
          <p className={`${textSecondary} text-base md:text-lg mb-10 max-w-xl mx-auto`}>
            AI-simulated conversations inspired by well-known coding educators — their teaching style, tone, and vibe.
          </p>
        </div>

        <div id="personas" className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
          <h2 className="text-center text-2xl font-bold mb-2">Choose Your Persona</h2>
          <p className={`text-center ${textSecondary} text-sm mb-10`}>
            Pick a persona to start a chat that feels real and engaging.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {personas.map((p) => (
              <div
                key={p.id}
                className={`group relative ${cardBg} border ${cardBorder} rounded-2xl p-6 backdrop-blur-sm hover:border-purple-400/50 transition-all hover:-translate-y-1 ${!darkMode ? 'shadow-md hover:shadow-xl shadow-gray-200/50' : ''}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl border border-white/10 overflow-hidden shrink-0">
                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <p className={`${textSecondary} text-sm`}>{p.tagline}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {(p.id === 'hitesh'
                    ? ['DSA', 'Fundamentals', 'Web Dev', 'Mentorship']
                    : ['System Design', 'Full-Stack', 'Docker', 'Backend']
                  ).map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs ${cardBg} border ${cardBorder} rounded-full px-3 py-1 ${textTertiary}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => setSelectedPersona(p)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2"
                >
                  Chat with {p.name.split(' ')[0]} →
                </button>
              </div>
            ))}
          </div>

          {personas.length === 0 && (
            <p className={`text-center ${textSecondary} mt-10`}>
              Loading personas... (backend chal raha hai check karo)
            </p>
          )}
        </div>

        <div id="features" className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
          <h2 className="text-center text-2xl font-bold mb-12">Why You'll Like It</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: '💬', title: 'Natural Chat', desc: 'Human-like, conversational replies' },
              { icon: '🎤', title: 'Voice Input', desc: 'Bolke bhi baat kar sakte ho' },
              { icon: '🔊', title: 'Voice Output', desc: 'Replies awaaz mein bhi sun sakte ho' },
              { icon: '⚡', title: 'Instant Replies', desc: 'Turant jawab, 24/7 available' },
            ].map((f) => (
              <div key={f.title}>
                <div className={`w-12 h-12 mx-auto rounded-xl ${cardBg} border ${cardBorder} flex items-center justify-center text-xl mb-3`}>
                  {f.icon}
                </div>
                <h4 className="font-semibold text-sm mb-1">{f.title}</h4>
                <p className={`${textSecondary} text-xs`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------- Chat Screen ----------
  return (
    <div className={`min-h-screen ${bgMain} ${textMain} flex flex-col relative overflow-hidden transition-colors duration-300`}>
      {darkMode ? (
        <>
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-600/20 rounded-full blur-[130px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[130px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-200/30 rounded-full blur-[130px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-[130px] pointer-events-none" />
        </>
      )}

      {/* Header */}
      <div className={`relative z-10 ${cardBg} border-b ${cardBorder} backdrop-blur-md px-4 py-3 flex items-center gap-3 ${!darkMode ? 'shadow-sm' : ''}`}>
        <button
          onClick={goBack}
          className={`${textSecondary} hover:opacity-70 text-sm px-3 py-2 rounded-lg border ${cardBorder} hover:bg-white/5 transition flex items-center gap-1`}
        >
          ← <span className="hidden sm:inline">Back</span>
        </button>

        <div className="w-11 h-11 rounded-xl border border-white/10 overflow-hidden shrink-0 shadow-lg shadow-purple-500/10">
          <img src={selectedPersona.avatar} alt={selectedPersona.name} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{selectedPersona.name}</h2>
          <p className={`text-xs ${textSecondary} flex items-center gap-1`}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            AI simulation — not the real person
          </p>
        </div>

        <ThemeToggle />

        <button
          onClick={clearChat}
          disabled={messages.length === 0}
          className={`hidden sm:flex text-xs sm:text-sm px-3 py-2 rounded-full border transition items-center gap-1 ${cardBg} ${cardBorder} ${textSecondary} hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed`}
          title="Chat clear karo"
        >
          🗑️
        </button>

        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`text-xs sm:text-sm px-3 py-2 rounded-full border transition whitespace-nowrap ${
            voiceEnabled
              ? 'bg-purple-500/20 border-purple-400/50 text-purple-300'
              : `${cardBg} ${cardBorder} ${textSecondary} hover:bg-white/10`
          }`}
        >
          {voiceEnabled ? '🔊 On' : '🔇 Off'}
        </button>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl w-full mx-auto">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center mt-10 gap-6">
            <div className="w-20 h-20 rounded-3xl border border-white/10 overflow-hidden shadow-xl shadow-purple-500/10">
              <img src={selectedPersona.avatar} alt={selectedPersona.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-medium mb-1">
                Baat shuru karo {selectedPersona.name} se
              </p>
              <p className={`${textSecondary} text-sm`}>Kuch bhi pucho, ya neeche se try karo 👇</p>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-md">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className={`text-left text-sm ${cardBg} hover:bg-white/10 border ${cardBorder} rounded-xl px-4 py-3 ${textTertiary} transition`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg border border-white/10 overflow-hidden shrink-0">
                <img src={selectedPersona.avatar} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="group relative max-w-[75%]">
              <div
                className={`px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl rounded-br-md shadow-purple-500/20'
                    : `${cardBg} border ${cardBorder} ${textMain} rounded-2xl rounded-bl-md ${!darkMode ? 'shadow-sm' : ''}`
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'assistant' && (
                <button
                  onClick={() => copyMessage(msg.content, idx)}
                  className={`absolute -bottom-6 left-1 text-xs ${textSecondary} opacity-0 group-hover:opacity-100 transition flex items-center gap-1 hover:opacity-100`}
                >
                  {copiedIdx === idx ? <>✓ Copied</> : <>📋 Copy</>}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-8 h-8 rounded-lg border border-white/10 overflow-hidden shrink-0">
              <img src={selectedPersona.avatar} alt="" className="w-full h-full object-cover" />
            </div>
            <div className={`${cardBg} border ${cardBorder} px-4 py-3 rounded-2xl rounded-bl-md flex gap-1.5 items-center`}>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input box */}
      <div className={`relative z-10 p-4 ${cardBg} border-t ${cardBorder} backdrop-blur-md ${!darkMode ? 'shadow-[0_-4px_20px_rgba(0,0,0,0.04)]' : ''}`}>
        <div className="max-w-2xl mx-auto flex gap-2 items-center">
          <button
            onClick={toggleListening}
            className={`w-10 h-10 shrink-0 rounded-full border flex items-center justify-center transition ${
              isListening
                ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                : `${cardBg} ${textSecondary} ${cardBorder} hover:bg-white/10`
            }`}
          >
            {isListening ? '🎙️' : '🎤'}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Apna message likho ya mic dabao..."
            className={`flex-1 ${cardBg} border ${cardBorder} rounded-full px-4 py-2.5 text-sm ${textMain} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition`}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center shadow-lg shadow-purple-500/20 text-white"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;