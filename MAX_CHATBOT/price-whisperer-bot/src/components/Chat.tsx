import { useState } from 'react';
import { chatAPI, ChatMessage } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

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

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en');

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessage: ChatMessage = { question: input };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    let responseText = '';
    setMessages(prev => [...prev, { question: '', response: '' }]); // Placeholder for streaming
    try {
      await chatAPI.streamChat(input, undefined, language, (chunk) => {
        responseText += chunk;
        setMessages(prev => {
          // Update last assistant message or add new
          if (prev[prev.length - 1]?.response !== undefined) {
            return [...prev.slice(0, -1), { question: '', response: responseText }];
          } else {
            return [...prev, { question: '', response: responseText }];
          }
        });
      });
    } catch (error) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { ...newMessage, error: 'Failed to get response' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-2 flex gap-2 items-center">
        <label htmlFor="language">Language:</label>
        <select id="language" value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="en">English</option>
          <option value="gu">Gujarati</option>
        </select>
      </div>
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const structured = message.response ? parseStructuredResponse(message.response) : null;
            if (structured) {
              return (
                <div key={index} className="space-y-2">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <p className="font-semibold">You:</p>
                    <p>{message.question}</p>
                  </div>
                  <div className="bg-secondary/10 p-3 rounded-lg">
                    <p className="font-semibold">AI:</p>
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
              );
            }
            return (
              <div key={index} className="space-y-2">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="font-semibold">You:</p>
                  <p>{message.question}</p>
                </div>
                {message.response && (
                  <div className="bg-secondary/10 p-3 rounded-lg">
                    <p className="font-semibold">AI:</p>
                    <p>{message.response}</p>
                  </div>
                )}
                {message.error && (
                  <div className="bg-destructive/10 p-3 rounded-lg">
                    <p className="text-destructive">{message.error}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="flex gap-2 mt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <Button onClick={handleSendMessage} disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </Card>
  );
} 