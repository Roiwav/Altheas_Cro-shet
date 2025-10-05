import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ARErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AR Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-pink-50 to-purple-100">
          <div className="max-w-md p-8 text-center bg-white shadow-2xl rounded-2xl">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="mb-4 text-2xl font-bold text-gray-800">
              AR Experience Error
            </h2>
            <p className="mb-6 text-gray-600">
              We're having trouble loading the AR experience. This could be due to:
            </p>
            <ul className="mb-6 space-y-2 text-sm text-left text-gray-600">
              <li>• Missing 3D model files</li>
              <li>• Browser compatibility issues</li>
              <li>• Network connection problems</li>
            </ul>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Technical Details
                </summary>
                <pre className="p-3 mt-2 overflow-auto text-xs bg-gray-100 rounded max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-6 py-3 font-semibold text-white transition-colors bg-pink-500 rounded-lg hover:bg-pink-600"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-6 py-3 font-semibold text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
