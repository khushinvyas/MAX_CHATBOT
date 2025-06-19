import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles } from "lucide-react";
import CustomerChat from "./CustomerChat";
import { useToast } from "@/hooks/use-toast";

interface CustomerLoginProps {
  onBack: () => void;
}

const CustomerLogin = ({ onBack }: CustomerLoginProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", name: "" });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Store user info in localStorage
      localStorage.setItem('customerName', credentials.name);
      localStorage.setItem('customerEmail', credentials.email);
      
      setIsLoggedIn(true);
      toast({
        title: "Welcome!",
        description: `Hello ${credentials.name}! You can now chat with our AI assistant.`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customerName');
    localStorage.removeItem('customerEmail');
    setIsLoggedIn(false);
  };

  if (isLoggedIn) {
    return <CustomerChat customerName={credentials.name} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="absolute top-4 left-4 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="mx-auto mb-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl w-20 h-20 flex items-center justify-center shadow-lg">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Customer Portal
          </CardTitle>
          <CardDescription className="text-slate-600 text-base">
            Enter your details to start chatting with our AI assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStartChat} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-medium">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={credentials.name}
                onChange={(e) => setCredentials(prev => ({ ...prev, name: e.target.value }))}
                required
                className="h-12 border-slate-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                required
                className="h-12 border-slate-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl transition-all duration-200"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Starting...' : 'Start Chatting'}
            </Button>
          </form>
          
          <div className="mt-8 p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-700 font-medium mb-2">
              <strong>What you can ask:</strong>
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Product prices and availability</li>
              <li>• Technical specifications</li>
              <li>• General product enquiries</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerLogin;
