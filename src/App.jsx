import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Download, Edit2, Wine, Check, Droplet, SkipForward, Sparkles, MessageSquare, X, Send, Loader2 } from 'lucide-react';

// --- GEMINI API CONFIGURATION ---
const apiKey = ""; // The execution environment provides this key at runtime.

const callGemini = async (prompt, systemInstruction = "") => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Service temporarily unavailable. Please try again later.";
  }
};

// --- STYLING & FONTS ---
const FontLoader = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&display=swap');
      
      body {
        font-family: 'Lato', sans-serif;
      }
      
      h1, h2, h3, h4, h5, h6, .serif {
        font-family: 'Playfair Display', serif;
      }

      /* Wine Drop Animation */
      @keyframes drop {
        0% { transform: translateY(-20px) scale(0.8); opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { transform: translateY(60px) scale(1.1); opacity: 0; }
      }

      .wine-drop {
        position: absolute;
        width: 8px;
        height: 12px;
        background: rgba(114, 47, 55, 0.15); /* Merlot color, very subtle */
        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        animation: drop 4s infinite ease-in;
      }

      /* Custom Scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
      }
      ::-webkit-scrollbar-track {
        background: #f9fafb; 
      }
      ::-webkit-scrollbar-thumb {
        background: #e5e7eb; 
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #d1d5db; 
      }
      
      .fade-enter {
        opacity: 0;
        transform: translateY(10px);
      }
      .fade-enter-active {
        opacity: 1;
        transform: translateY(0);
        transition: opacity 500ms, transform 500ms;
      }
      
      .typing-dot {
        animation: typing 1.4s infinite ease-in-out both;
      }
      .typing-dot:nth-child(1) { animation-delay: -0.32s; }
      .typing-dot:nth-child(2) { animation-delay: -0.16s; }
      
      @keyframes typing {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
    `}
  </style>
);

// --- DATA: QUESTIONS ---
const QUESTIONS = [
  {
    id: 'brandName',
    section: 'Identity',
    question: "First, what is the name of your Wine Brand?",
    type: 'text',
    placeholder: "e.g., Chateau Margaux"
  },
  {
    id: 'essence_desc',
    section: '1. Brand Essence',
    question: "Describe your brand in one sentence. Let your instincts guide this answer.",
    type: 'textarea',
    placeholder: "The essence of your winery..."
  },
  {
    id: 'essence_emotions',
    section: '1. Brand Essence',
    question: "What emotions should your communication create?",
    type: 'multi-select',
    options: ["Warm - Welcoming, friendly", "Premium - Sophisticated, elegant", "Fun - Playful, energetic", "Educational - Informative, expert", "Modern - Innovative", "Traditional - Historic"]
  },
  {
    id: 'essence_style_words',
    section: '1. Brand Essence',
    question: "List three words that describe your brand style.",
    type: 'text',
    placeholder: "e.g., Rustic, Honest, Bold"
  },
  {
    id: 'essence_never_words',
    section: '1. Brand Essence',
    question: "List three words your brand should NEVER sound like.",
    type: 'text',
    placeholder: "e.g., Cheap, Arrogant, Trendy"
  },
  {
    id: 'essence_avoid_actions',
    section: '1. Brand Essence',
    question: "Is there anything your brand would never say or do?",
    type: 'textarea',
    placeholder: "Think about slang, tone, or sensitive topics..."
  },
  {
    id: 'audience_current',
    section: '2. Your Audience',
    question: "Who buys your wines today? (Select all that apply)",
    type: 'multi-select',
    options: ["Gen Z (1997-2012)", "Millennials (1981-1996)", "Wine Enthusiasts", "Sommeliers", "HoReCa", "Collectors"]
  },
  {
    id: 'audience_growth',
    section: '2. Your Audience',
    question: "Who do you want MORE of? (Pick 1-2 key groups)",
    type: 'text',
    placeholder: "e.g., Younger demographic, High-end collectors"
  },
  {
    id: 'audience_questions',
    section: '2. Your Audience',
    question: "What questions do customers ask the most?",
    type: 'textarea',
    placeholder: "Top 3 questions your AI should be ready to answer..."
  },
  {
    id: 'product_priority',
    section: '3. Your Wines',
    question: "What wines or products should the AI know FIRST?",
    type: 'select',
    options: ["Flagship Wines", "New Releases", "Bestsellers", "Full Portfolio"]
  },
  {
    id: 'product_notes',
    section: '3. Your Wines',
    question: "Do you have detailed tasting notes available for the AI to learn?",
    type: 'yes-no'
  },
  {
    id: 'product_stories',
    section: '3. Your Wines',
    question: "Are there any key stories behind specific wines?",
    type: 'textarea',
    placeholder: "Brief, memorable stories..."
  },
  {
    id: 'comm_email',
    section: '4. Communication',
    question: "Do you currently send marketing emails?",
    type: 'yes-no'
  },
  {
    id: 'comm_social_platforms',
    section: '4. Communication',
    question: "Which social platforms do you actually use?",
    type: 'multi-select',
    options: ["Instagram", "TikTok", "Facebook", "LinkedIn", "Twitter/X", "YouTube"]
  },
  {
    id: 'comm_content_style',
    section: '4. Communication',
    question: "What type of content feels most like 'your brand'?",
    type: 'textarea',
    placeholder: "e.g., Behind the scenes, polished bottle shots, harvest videos..."
  },
  {
    id: 'story_origin',
    section: '5. Brand Story',
    question: "What's your short origin story? How did you start?",
    type: 'textarea',
    placeholder: "Keep it simple..."
  },
  {
    id: 'story_diff',
    section: '5. Brand Story',
    question: "What makes your brand different? (1-2 points)",
    type: 'textarea',
    placeholder: "Why do people choose you over others?"
  },
  {
    id: 'story_sustainability',
    section: '5. Brand Story',
    question: "Is sustainability central to your brand story?",
    type: 'yes-no'
  },
  {
    id: 'assets_existing',
    section: '6. Assets',
    question: "What content assets do you already have? (Select all)",
    type: 'multi-select',
    options: ["Website Text", "Product Photos", "Formal Tasting Notes", "Brochures/Menus", "Social Media Library", "Press Releases", "Brand Book"]
  },
  {
    id: 'gaps_misunderstood',
    section: '7. Clarity',
    question: "What do customers misunderstand the most about your brand?",
    type: 'textarea',
    placeholder: "Common misconceptions..."
  },
  {
    id: 'goals_functions',
    section: '8. AI Goals',
    question: "What should your AI assistant actually DO? (Select priorities)",
    type: 'multi-select',
    options: ["Answer Inquiries", "Recommend Wines", "Create Social Content", "Write Emails", "Support Trade/B2B", "Educate Consumers"]
  },
  {
    id: 'goals_tone',
    section: '8. AI Goals',
    question: "What overall tone should the AI use?",
    type: 'select',
    options: ["Warm & Friendly", "Premium & Sophisticated", "Casual & Relaxed", "Modern & Fresh", "Educational & Expert"]
  },
  {
    id: 'boundaries_avoid',
    section: '9. Boundaries',
    question: "Are there specific topics the AI should avoid discussing?",
    type: 'text',
    placeholder: "e.g., Politics, Religion, Specific harvest years"
  },
  {
    id: 'boundaries_competitors',
    section: '9. Boundaries',
    question: "Are there competitors the AI should never mention?",
    type: 'text',
    placeholder: "Names of competitors..."
  },
  {
    id: 'boundaries_pricing',
    section: '9. Boundaries',
    question: "Are there sensitive pricing areas to avoid?",
    type: 'text',
    placeholder: "e.g., Bulk discounts, wholesale margins"
  },
  {
    id: 'guidelines_do',
    section: '10. Guidelines',
    question: "DO: What is one thing you ALWAYS want emphasized?",
    type: 'textarea',
    placeholder: "Key strengths or values..."
  },
  {
    id: 'guidelines_dont',
    section: '10. Guidelines',
    question: "DON'T: What is one thing you NEVER want highlighted?",
    type: 'textarea',
    placeholder: "Phrases or misleading areas..."
  }
];

// --- COMPONENTS ---

const Intro = ({ onStart }) => (
  <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 relative overflow-hidden z-10">
    <div className="absolute top-10 left-0 right-0 flex justify-center">
       <span className="text-xl tracking-[0.3em] font-serif font-bold text-gray-900">SOMM DIGI</span>
    </div>
    
    <div className="max-w-2xl animate-fade-in-up">
      <h1 className="text-5xl md:text-6xl font-serif text-gray-900 mb-8 leading-tight">
        First step to building your brand’s AI
      </h1>
      <p className="text-gray-500 text-lg mb-10 font-light max-w-lg mx-auto leading-relaxed">
        A guided journey to capture the essence, voice, and soul of your brand. Designed for wineries and all wine brands across the industry to create a truly bespoke artificial intelligence.
      </p>
      <button 
        onClick={onStart}
        className="group bg-gray-900 text-white px-10 py-4 rounded-full text-lg font-light tracking-wide transition-all duration-300 hover:bg-red-900 hover:shadow-xl flex items-center gap-3 mx-auto"
      >
        Start the Process
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  </div>
);

const ProgressBar = ({ current, total, section }) => (
  <div className="w-full max-w-3xl mx-auto mb-12">
    <div className="flex justify-between text-xs uppercase tracking-widest text-gray-400 mb-2 font-serif">
      <span>{section}</span>
      <span>{Math.round(((current + 1) / total) * 100)}% Complete</span>
    </div>
    <div className="h-0.5 w-full bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-red-900 transition-all duration-500 ease-out"
        style={{ width: `${((current + 1) / total) * 100}%` }}
      />
    </div>
  </div>
);

const QuestionCard = ({ data, answer, onChange, onNext, onSkip, onBack, isLast }) => {
  const [autoForwarding, setAutoForwarding] = useState(false);

  // Handle auto-forward for single-choice types
  const handleSelection = (val) => {
    onChange(val);
    if (data.type === 'select' || data.type === 'yes-no') {
      if (!autoForwarding) {
        setAutoForwarding(true);
        setTimeout(() => {
          onNext();
          setAutoForwarding(false);
        }, 500); 
      }
    }
  };

  const toggleOption = (option) => {
    const currentList = Array.isArray(answer) ? answer : [];
    if (currentList.includes(option)) {
      onChange(currentList.filter(item => item !== option));
    } else {
      onChange([...currentList, option]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full fade-enter-active">
      <h2 className="text-3xl md:text-4xl font-serif text-gray-900 mb-8 leading-snug">
        {data.question}
      </h2>

      <div className="min-h-[200px] mb-8">
        {data.type === 'text' && (
          <input 
            autoFocus
            type="text" 
            value={answer || ''} 
            onChange={(e) => onChange(e.target.value)}
            placeholder={data.placeholder}
            className="w-full bg-transparent border-b border-gray-300 text-2xl py-2 focus:outline-none focus:border-red-900 transition-colors font-serif placeholder-gray-300"
          />
        )}

        {data.type === 'textarea' && (
          <textarea 
            autoFocus
            value={answer || ''} 
            onChange={(e) => onChange(e.target.value)}
            placeholder={data.placeholder}
            className="w-full bg-transparent border-b border-gray-300 text-xl py-2 focus:outline-none focus:border-red-900 transition-colors font-serif placeholder-gray-300 resize-none h-32"
          />
        )}

        {data.type === 'select' && (
          <div className="space-y-3">
            {data.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleSelection(opt)}
                className={`w-full text-left px-6 py-4 rounded-lg border transition-all duration-200 ${
                  answer === opt 
                    ? 'border-red-900 bg-red-50 text-red-900 shadow-sm' 
                    : 'border-gray-200 hover:border-gray-400 text-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{opt}</span>
                  {answer === opt && <Check className="w-5 h-5 animate-in fade-in zoom-in" />}
                </div>
              </button>
            ))}
          </div>
        )}

        {data.type === 'multi-select' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.options.map((opt) => {
              const isSelected = Array.isArray(answer) && answer.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => toggleOption(opt)}
                  className={`text-left px-5 py-3 rounded-lg border transition-all duration-200 flex items-center justify-between ${
                    isSelected
                      ? 'border-red-900 bg-red-50 text-red-900 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-400 text-gray-600'
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <Check className="w-4 h-4 animate-in fade-in zoom-in" />}
                </button>
              );
            })}
          </div>
        )}

        {data.type === 'yes-no' && (
          <div className="flex gap-6">
            {['Yes', 'No'].map((opt) => (
              <button
                key={opt}
                onClick={() => handleSelection(opt)}
                className={`px-10 py-4 rounded-full text-lg border transition-all duration-200 ${
                  answer === opt 
                    ? 'bg-gray-900 text-white border-gray-900 shadow-lg' 
                    : 'border-gray-300 text-gray-500 hover:border-gray-900 hover:text-gray-900'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-8 border-t border-gray-100">
        <button 
          onClick={onBack}
          className="text-gray-400 hover:text-gray-900 flex items-center gap-2 transition-colors uppercase tracking-wider text-sm font-semibold"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        
        <div className="flex gap-4">
          <button 
            onClick={onSkip}
            className="text-gray-400 hover:text-red-900 px-4 py-3 rounded-full flex items-center gap-2 transition-all uppercase tracking-wider text-sm font-semibold hover:bg-gray-50"
          >
            Skip <SkipForward className="w-4 h-4" />
          </button>
          
          <button 
            onClick={onNext}
            disabled={!answer || (Array.isArray(answer) && answer.length === 0)}
            className="bg-gray-900 text-white px-8 py-3 rounded-full flex items-center gap-2 hover:bg-red-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isLast ? 'Review Summary' : 'Next Question'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- GEMINI POWERED COMPONENTS ---

const ChatPreview = ({ answers, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Hello! I am the AI assistant for ${answers.brandName || 'your brand'}. How can I help you discover our wines today?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Construct System Prompt based on user answers
    const systemPrompt = `
      You are the official AI Brand Ambassador for "${answers.brandName || 'a premium wine brand'}".
      
      CORE IDENTITY:
      - Essence: ${answers.essence_desc || 'N/A'}
      - Tone Keywords: ${Array.isArray(answers.essence_style_words) ? answers.essence_style_words : answers.essence_style_words || 'Professional, Knowledgeable'}
      - Emotional Goal: ${Array.isArray(answers.essence_emotions) ? answers.essence_emotions.join(', ') : 'N/A'}
      - Desired Tone: ${answers.goals_tone || 'Warm & Friendly'}
      
      AUDIENCE:
      - You are speaking to: ${Array.isArray(answers.audience_current) ? answers.audience_current.join(', ') : 'Wine lovers'}
      
      STRICT BOUNDARIES (DO NOT VIOLATE):
      - Do NOT discuss: ${answers.boundaries_avoid || 'Politics, Religion'}
      - Do NOT mention competitors: ${answers.boundaries_competitors || 'None'}
      - Pricing sensitivity: ${answers.boundaries_pricing || 'Standard retail'}
      
      BEHAVIOR:
      - Keep responses concise but elegant. 
      - Use the "Playfair" style: sophisticated but not archaic.
      - If asked about specific wines, prioritize: ${answers.product_priority || 'Flagship wines'}.
      - Answer this specific user query now.
    `;

    const responseText = await callGemini(input, systemPrompt);
    
    setMessages(prev => [...prev, { role: 'assistant', text: responseText }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] border border-gray-200">
        
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-900 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-red-100" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg">Test Drive Your AI</h3>
              <p className="text-xs text-gray-400">Powered by Gemini • Live Prototype</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-gray-50 p-4 overflow-y-auto" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-gray-900 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask your AI something..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-3 focus:outline-none focus:border-red-900 focus:bg-white transition-all font-serif placeholder-gray-400"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-red-900 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ManifestoGenerator = ({ answers }) => {
  const [manifesto, setManifesto] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateManifesto = async () => {
    setLoading(true);
    const prompt = `
      Write a short, inspiring, and elegant "Brand Manifesto" (approx 80 words) for a wine brand.
      Brand Name: ${answers.brandName}
      Essence: ${answers.essence_desc}
      Emotions: ${Array.isArray(answers.essence_emotions) ? answers.essence_emotions.join(', ') : ''}
      Style: ${answers.essence_style_words}
      
      The output should be poetic, professional, and ready for a "About Us" page.
    `;
    
    const result = await callGemini(prompt, "You are an expert copywriter for luxury wine brands.");
    setManifesto(result);
    setLoading(false);
  };

  if (!manifesto && !loading) {
    return (
      <button 
        onClick={generateManifesto}
        className="w-full mt-4 bg-gradient-to-r from-rose-50 to-white border border-rose-100 hover:border-red-900/30 text-red-900 px-6 py-4 rounded-xl flex items-center justify-center gap-3 group transition-all shadow-sm hover:shadow-md"
      >
        <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="font-serif italic text-lg">✨ Generate AI Brand Manifesto</span>
      </button>
    );
  }

  return (
    <div className="mt-6 bg-rose-50/50 border border-rose-100 rounded-xl p-6 relative animate-in fade-in slide-in-from-bottom-4">
      <div className="absolute top-4 right-4 text-red-900/20">
        <Sparkles className="w-8 h-8" />
      </div>
      <h4 className="font-serif text-red-900 font-bold mb-3 text-lg flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> Brand Manifesto
      </h4>
      {loading ? (
        <div className="flex items-center gap-3 text-gray-500 italic py-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          Weaving your brand story...
        </div>
      ) : (
        <div className="prose prose-red max-w-none">
          <p className="font-serif text-gray-800 italic text-lg leading-relaxed">
            "{manifesto}"
          </p>
        </div>
      )}
    </div>
  );
};

// --- SUMMARY COMPONENT (UPDATED) ---

const Summary = ({ answers, onEdit, onGeneratePDF, onTestAI }) => {
  return (
    <div className="max-w-4xl mx-auto w-full animate-fade-in-up pb-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-serif text-gray-900 mb-4">Review Your Profile</h2>
        <p className="text-gray-500 mb-8">Your custom AI blueprint is ready. Review details or test the AI below.</p>
        
        {/* ACTION BUTTONS */}
        <div className="flex flex-col md:flex-row justify-center gap-4 mb-12">
           <button 
            onClick={onTestAI}
            className="bg-red-900 text-white px-8 py-4 rounded-full text-lg shadow-lg hover:shadow-xl hover:bg-red-950 transition-all duration-300 flex items-center justify-center gap-3"
          >
            <MessageSquare className="w-5 h-5" />
            <span>✨ Test Drive Your AI</span>
          </button>
          
          <button 
            onClick={onGeneratePDF}
            className="bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-full text-lg shadow-sm hover:shadow-md hover:border-gray-400 transition-all duration-300 flex items-center justify-center gap-3"
          >
            <Download className="w-5 h-5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Manifesto Section embedded in the summary card */}
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-xl font-serif text-gray-900 mb-2">Brand Narrative</h3>
          <p className="text-sm text-gray-500 mb-4">Use Gemini to generate a cohesive narrative from your data points.</p>
          <ManifestoGenerator answers={answers} />
        </div>

        {/* Existing Questions */}
        {QUESTIONS.map((q, index) => (
          <div key={q.id} className="p-6 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                  {q.section}
                </span>
                <h3 className="text-lg font-serif text-gray-800 mb-2">{q.question}</h3>
                <div className="text-gray-600 leading-relaxed font-light">
                  {Array.isArray(answers[q.id]) 
                    ? answers[q.id].join(', ') 
                    : (answers[q.id] || <span className="text-gray-300 italic">Skipped</span>)
                  }
                </div>
              </div>
              <button 
                onClick={() => onEdit(index)}
                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-gray-900 transition-all"
                title="Edit this section"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- BACKGROUND EFFECT ---
const BackgroundEffect = () => {
  const [drops, setDrops] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const id = Date.now();
      const left = Math.random() * 100;
      const size = Math.random() * 0.5 + 0.5; // Scale variation
      setDrops(prev => [...prev, { id, left, size }]);
      
      // Cleanup old drops
      setTimeout(() => {
        setDrops(prev => prev.filter(d => d.id !== id));
      }, 4000);
    }, 2000); // New drop every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Subtle Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-rose-50 opacity-80" />
      
      {/* Animated Drops */}
      {drops.map(drop => (
        <div 
          key={drop.id}
          className="wine-drop"
          style={{ 
            left: `${drop.left}%`, 
            top: '10%',
            transform: `scale(${drop.size})`
          }}
        />
      ))}
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [step, setStep] = useState('intro'); // intro, questions, summary
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Load jsPDF from CDN
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    }
  }, []);

  const handleStart = () => {
    setStep('questions');
  };

  const handleAnswerChange = (value) => {
    setAnswers(prev => ({
      ...prev,
      [QUESTIONS[currentQuestionIndex].id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setStep('summary');
    }
  };

  const handleSkip = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setStep('summary');
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      setStep('intro');
    }
  };

  const handleEdit = (index) => {
    setCurrentQuestionIndex(index);
    setStep('questions');
  };

  const generatePDF = async () => {
    if (!window.jspdf) {
      alert("PDF generator is still loading. Please try again in a moment.");
      return;
    }

    setIsGenerating(true);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Config
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 20;

    // Helper for page breaks
    const checkPageBreak = (heightNeeded) => {
      if (yPos + heightNeeded > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPos = 20;
      }
    };

    // Header
    doc.setFont("times", "bold"); 
    doc.setFontSize(24);
    doc.setTextColor(114, 47, 55); 
    doc.text("SOMM DIGI", margin, yPos);
    yPos += 10;
    
    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    doc.text(`AI Brand Profile: ${answers.brandName || 'Untitled Brand'}`, margin, yPos);
    yPos += 20;

    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos - 10, pageWidth - margin, yPos - 10);

    // Content
    doc.setFont("helvetica", "normal");
    
    QUESTIONS.forEach((q, i) => {
      checkPageBreak(30);

      // Section Header (only if changed)
      if (i === 0 || QUESTIONS[i-1].section !== q.section) {
        yPos += 5;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(q.section.toUpperCase(), margin, yPos);
        yPos += 7;
      }

      // Question
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const questionLines = doc.splitTextToSize(q.question, contentWidth);
      doc.text(questionLines, margin, yPos);
      yPos += (questionLines.length * 5) + 2;

      // Answer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      
      let answerText = "Skipped";
      if (answers[q.id]) {
        answerText = Array.isArray(answers[q.id]) ? answers[q.id].join(", ") : answers[q.id];
      }

      const answerLines = doc.splitTextToSize(answerText, contentWidth);
      checkPageBreak(answerLines.length * 5);
      doc.text(answerLines, margin, yPos);
      yPos += (answerLines.length * 5) + 10;
    });

    // --- NEXT STEPS & CTA SECTION ---
    doc.addPage();
    yPos = 40;
    
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.setTextColor(114, 47, 55);
    doc.text("Next Steps & Feedback", pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    const feedbackText = "Based on the comprehensive profile you have just built, your brand is now ready for AI integration. This document serves as the foundational 'System Prompt' and knowledge base for your digital assistant.\n\nYour choices regarding tone, audience, and boundaries have been compiled to ensure the AI reflects your winery's unique identity—whether that is sophisticated and historical, or modern and approachable.";
    const feedbackLines = doc.splitTextToSize(feedbackText, contentWidth - 20);
    doc.text(feedbackLines, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 40;
    
    // CTA Box
    doc.setDrawColor(114, 47, 55);
    doc.setLineWidth(1);
    doc.rect(margin + 10, yPos, contentWidth - 20, 60, 'S');
    
    yPos += 20;
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text("Ready to Activate?", pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Visit SOMM DIGI in the ChatGPT Store to upload this profile.", pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 10;
    doc.setTextColor(114, 47, 55); // Link color
    doc.text("Search 'SOMM DIGI' in ChatGPT", pageWidth / 2, yPos, { align: 'center' });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('Generated by SOMM DIGI', pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    }

    doc.save(`${answers.brandName || 'Wine_Brand'}_AI_Profile.pdf`);
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 relative selection:bg-red-100 selection:text-red-900 font-sans">
      <FontLoader />
      <BackgroundEffect />

      {/* Header */}
      {step !== 'intro' && (
        <div className="fixed top-0 left-0 right-0 p-6 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-100/50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
             <span className="text-lg font-serif font-bold tracking-widest text-gray-900">SOMM DIGI</span>
             {answers.brandName && <span className="text-sm text-gray-400 font-serif">{answers.brandName}</span>}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`relative z-10 min-h-screen flex flex-col ${step !== 'intro' ? 'pt-24 px-6 pb-12' : ''}`}>
        
        {step === 'intro' && <Intro onStart={handleStart} />}

        {step === 'questions' && (
          <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
            <ProgressBar 
              current={currentQuestionIndex} 
              total={QUESTIONS.length} 
              section={QUESTIONS[currentQuestionIndex].section}
            />
            <QuestionCard 
              data={QUESTIONS[currentQuestionIndex]}
              answer={answers[QUESTIONS[currentQuestionIndex].id]}
              onChange={handleAnswerChange}
              onNext={handleNext}
              onSkip={handleSkip}
              onBack={handleBack}
              isLast={currentQuestionIndex === QUESTIONS.length - 1}
            />
          </div>
        )}

        {step === 'summary' && (
          <Summary 
            answers={answers} 
            onEdit={handleEdit} 
            onGeneratePDF={generatePDF}
            onTestAI={() => setShowChat(true)}
          />
        )}
      </main>

      {/* CHAT OVERLAY */}
      {showChat && <ChatPreview answers={answers} onClose={() => setShowChat(false)} />}
    </div>
  );
}

4.  Click **Commit changes...** > **Commit changes**.

---

### **Phase 4: Launch on Vercel**

You now have a perfect repository with all 6 required files.

1.  Go to [Vercel](https://vercel.com/dashboard).
2.  Click **Add New...** > **Project**.
3.  You will see `somm-digi-fresh`. Click **Import**.
4.  Leave all settings as they are. Click **Deploy**.

This time, because all the files are in the right places, Vercel will build it instantly.
