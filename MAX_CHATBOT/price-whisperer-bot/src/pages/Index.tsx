
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users } from "lucide-react";
import AdminLogin from "@/components/AdminLogin";
import CustomerLogin from "@/components/CustomerLogin";

const Index = () => {
  const [selectedRole, setSelectedRole] = useState<"admin" | "customer" | null>(null);

  if (selectedRole === "admin") {
    return <AdminLogin onBack={() => setSelectedRole(null)} />;
  }

  if (selectedRole === "customer") {
    return <CustomerLogin onBack={() => setSelectedRole(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Enquiry Chatbot System
          </h1>
          <p className="text-xl text-gray-600">
            Choose your role to access the platform
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Admin Card */}
          <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 hover:border-blue-300">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Admin Portal</CardTitle>
              <CardDescription className="text-gray-600">
                Manage price lists and system configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Upload and manage price lists
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Monitor customer interactions
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  System administration
                </li>
              </ul>
              <Button 
                onClick={() => setSelectedRole("admin")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Access Admin Portal
              </Button>
            </CardContent>
          </Card>

          {/* Customer Card */}
          <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 hover:border-green-300">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Customer Portal</CardTitle>
              <CardDescription className="text-gray-600">
                Get instant answers to your product enquiries
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Ask about product prices
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Get instant responses
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  24/7 availability
                </li>
              </ul>
              <Button 
                onClick={() => setSelectedRole("customer")}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Start Chatting
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
