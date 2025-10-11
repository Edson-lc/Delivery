import React from 'react';

export default function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto mb-4" />
        <p className="text-gray-600">Carregando dashboard...</p>
      </div>
    </div>
  );
}
