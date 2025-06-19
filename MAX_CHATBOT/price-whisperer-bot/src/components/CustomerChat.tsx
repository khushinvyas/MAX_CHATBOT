import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Send, User, Bot, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { chatAPI } from "@/lib/api";

function parseStructuredResponse(text: string) {
  // Try to parse if the whole response is JSON
  try {
    const obj = JSON.parse(text);
    if (obj && typeof obj === 'object' && obj.text) return obj;
  } catch {}
  // Fallback: extract JSON from within text
  const jsonMatch = text.match(/\{.*\}/s);
  if (jsonMatch) {
    try {
      const obj = JSON.parse(jsonMatch[0]);
      if (obj && typeof obj === 'object' && obj.text) return obj;
    } catch {}
  }
  return null;
}

interface CustomerChatProps {
  customerName: string;
  onLogout: () => void;
}

const CustomerChat = ({ customerName, onLogout }: CustomerChatProps) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const { toast } = useToast();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    let responseText = '';
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]); // Placeholder for streaming
    try {
      await chatAPI.streamChat(userMessage, customerName, language, (chunk) => {
        responseText += chunk;
        setMessages(prev => {
          // Update last assistant message or add new
          if (prev[prev.length - 1]?.role === 'assistant') {
            return [...prev.slice(0, -1), { role: 'assistant', content: responseText }];
          } else {
            return [...prev, { role: 'assistant', content: responseText }];
          }
        });
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  AI Assistant
                </h1>
                <p className="text-sm text-slate-500">Welcome back, {customerName}</p>
              </div>
            </div>
            <Button 
              onClick={onLogout} 
              variant="outline" 
              className="border-slate-200 hover:bg-slate-50 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200/60">
            <CardTitle className="text-xl font-semibold text-slate-800">
              Chat with AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-2 flex gap-2 items-center">
              <label htmlFor="language">Language:</label>
              <select id="language" value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="gu">Gujarati</option>
              </select>
            </div>
            <div className="space-y-4 mb-6 h-[500px] overflow-y-auto">
              {messages.map((message, index) => {
                const structured = message.role === 'assistant' ? parseStructuredResponse(message.content) : null;
                if (structured) {
                  return (
                    <div key={index} className="flex justify-start">
                      <div className="flex items-start space-x-2 max-w-[80%]">
                        <div className="p-2 rounded-full bg-slate-100 text-slate-700">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-100 text-slate-700">
                          <div>{structured.text}</div>
                          {structured.prices && Array.isArray(structured.prices) && (
                            <table className="mt-2 w-full border">
                              <thead>
                                <tr>
                                  <th className="border px-2">Label</th>
                                  <th className="border px-2">Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {structured.prices.map((item: any, i: number) => (
                                  <tr key={i}>
                                    <td className="border px-2">{item.label || item.type}</td>
                                    <td className="border px-2">{item.price || item.amount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-[80%] ${
                        message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`p-4 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2 max-w-[80%]">
                    <div className="p-2 rounded-full bg-slate-100 text-slate-700">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-100 text-slate-700">
                      <p className="text-sm">Thinking...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="flex space-x-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 h-12 border-slate-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl transition-all duration-200"
                disabled={isLoading}
              />
              <Button
                type="submit"
                className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerChat;
