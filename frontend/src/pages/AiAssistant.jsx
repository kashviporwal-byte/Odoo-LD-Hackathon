import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AiAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Hello ${user?.name || 'Traveler'}! I am your offline GlobeTrotter Assistant. Ask me about Paris, Tokyo, Rome, or budget planning tips, and I'll give you instant recommendations.`
    }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input
    };

    setMessages((prev) => [...prev, userMessage]);
    const prompt = input.toLowerCase();
    setInput('');

    // Simulate simple AI responses locally
    setTimeout(() => {
      let aiText = '';
      if (prompt.includes('paris')) {
        aiText = '🗼 Paris Recommendation: I recommend visiting the Eiffel Tower Summit, touring the Louvre Museum, and enjoying a scenic evening cruise along the Seine. Average daily budget is High (around $250/day).';
      } else if (prompt.includes('tokyo')) {
        aiText = '🍣 Tokyo Recommendation: Check out Shibuya Crossing, visit the Senso-ji Buddhist Temple, and do a street food tour. Average daily budget is High (around $250/day).';
      } else if (prompt.includes('rome')) {
        aiText = '🏛️ Rome Recommendation: You must visit the Colosseum & Roman Forum, and join a Pizza/Gelato making class. Average daily budget is Medium (around $120/day).';
      } else if (prompt.includes('budget') || prompt.includes('cost') || prompt.includes('expense')) {
        aiText = '💰 Budget Tips: GlobeTrotter estimates costs based on city index levels. Low index cities average $65/day (stay + meals), Medium index cities average $155/day, and High index cities average $325/day. Transit adds a flat $100 per city stop.';
      } else {
        aiText = '✈️ That sounds like a wonderful destination! Make sure to schedule at least 3 days per city stop to enjoy the primary landmarks, local culinary dishes, and walking tours.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: aiText
        }
      ]);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
        {/* Header */}
        <div className="bg-primary-600 px-6 py-4 text-white flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <div>
            <h1 className="font-bold text-lg">AI Travel Advisor</h1>
            <p className="text-xs text-primary-100">Zero-Token Offline Assistant</p>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md px-4 py-2 rounded-lg text-sm shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-primary-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Footer */}
        <form onSubmit={handleSend} className="p-4 border-t border-gray-200 flex gap-2 bg-white">
          <input
            type="text"
            placeholder="Type a message (e.g. Tell me about Paris)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-semibold transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiAssistant;
