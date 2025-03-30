import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { auth } from '../lib/api';

export function HomePage() {
  const navigate = useNavigate();
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => auth.me(),
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8" data-testid="home-page">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8" data-testid="home-welcome-section">
          <h1 className="text-4xl font-bold text-gray-900 mb-2" data-testid="home-welcome-title">
            Welcome, {user?.data.firstName}!
          </h1>
          <p className="text-lg text-gray-600" data-testid="home-user-email">{user?.data.email}</p>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="home-content-grid">
          {/* Features section */}
          <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2" data-testid="home-features-section">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4" data-testid="home-features-title">Application Features</h2>
            <p className="text-gray-600 mb-6">
              Explore our comprehensive suite of tools designed to help you manage and monitor your data effectively.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1: Product Management */}
              <div className="bg-blue-50 rounded-lg p-5" data-testid="home-feature-products">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Product Management</h3>
                <p className="text-gray-600 mb-4">Browse, add, edit, and manage your product inventory.</p>
                <Button onClick={() => navigate('/products')} className="w-full" data-testid="home-products-button">
                  View Products
                </Button>
              </div>
              
              {/* Feature 2: User Management */}
              <div className="bg-green-50 rounded-lg p-5" data-testid="home-feature-users">
                <h3 className="text-lg font-medium text-green-800 mb-2">User Management</h3>
                <p className="text-gray-600 mb-4">Manage user accounts and permissions within the system.</p>
                <Button onClick={() => navigate('/users')} variant="outline" className="w-full border-green-600 text-green-700 hover:bg-green-100" data-testid="home-users-button">
                  Manage Users
                </Button>
              </div>

              {/* Feature 3: Orders */}
              <div className="bg-purple-50 rounded-lg p-5" data-testid="home-feature-profile">
                <h3 className="text-lg font-medium text-purple-800 mb-2">Order Processing & Profile</h3>
                <p className="text-gray-600 mb-4">View orders and manage your personal account information.</p>
                <Button onClick={() => navigate('/profile')} variant="outline" className="w-full border-purple-600 text-purple-700 hover:bg-purple-100" data-testid="home-profile-button">
                  View Profile & Orders
                </Button>
              </div>
            </div>
          </div>

          {/* Technical Features */}
          <div className="bg-white rounded-lg shadow-md p-6" data-testid="home-monitoring-section">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4" data-testid="home-monitoring-title">Advanced Monitoring</h2>
            
            <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200" data-testid="home-feature-traffic">
              <h3 className="text-lg font-medium text-amber-800 mb-2">Traffic Monitor</h3>
              <p className="text-gray-600 mb-3">
                Our real-time traffic monitoring system uses <span className="font-semibold">WebSocket technology</span> to provide immediate visibility into all API requests and responses.
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li>View all HTTP requests in real-time</li>
                <li>Monitor response times and status codes</li>
                <li>Debug API interactions immediately</li>
              </ul>
              <Button onClick={() => navigate('/traffic')} variant="outline" className="w-full border-amber-600 text-amber-700 hover:bg-amber-100" data-testid="home-traffic-button">
                Open Traffic Monitor
              </Button>
            </div>
          </div>

          {/* AI Integration */}
          <div className="bg-white rounded-lg shadow-md p-6" data-testid="home-ai-section">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4" data-testid="home-ai-title">AI Integration</h2>
            
            <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200" data-testid="home-feature-llm">
              <h3 className="text-lg font-medium text-indigo-800 mb-2">LLM Assistant</h3>
              <p className="text-gray-600 mb-3">
                Our AI assistant uses <span className="font-semibold">Server-Sent Events (SSE)</span> to stream responses in real-time, providing immediate assistance while conserving resources.
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li>Generate content with AI assistance</li>
                <li>Chat with our AI for immediate help</li>
                <li>Customize system prompts for better results</li>
              </ul>
              <Button 
                onClick={() => navigate('/llm')} 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                data-testid="home-llm-button"
              >
                Open AI Assistant
              </Button>
            </div>
          </div>
        </div>

        {/* Utilities section */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6" data-testid="home-utilities-section">
          <h2 className="text-xl font-semibold text-gray-800 mb-4" data-testid="home-utilities-title">Additional Utilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4" data-testid="home-feature-qr">
              <h3 className="text-md font-medium text-gray-700 mb-2">QR Code Generator</h3>
              <p className="text-gray-600 mb-3 text-sm">Generate valid and scannable QR codes for any text or URL. Perfect for sharing links or information quickly.</p>
              <Button onClick={() => navigate('/qr')} variant="outline" className="w-full border-gray-400" data-testid="home-qr-button">
                Generate QR Codes
              </Button>
            </div>
            <div className="border border-gray-200 rounded-lg p-4" data-testid="home-feature-email">
              <h3 className="text-md font-medium text-gray-700 mb-2">Email Service</h3>
              <p className="text-gray-600 mb-3 text-sm">Send emails through our system. Delivery is handled asynchronously with a delay of up to 10 minutes.</p>
              <Button onClick={() => navigate('/email')} variant="outline" className="w-full border-gray-400" data-testid="home-email-button">
                Send Emails
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 