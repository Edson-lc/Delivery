import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorState({ error }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {error ? 'Erro ao carregar dashboard' : 'Restaurante não encontrado'}
      </h2>
      <p className="text-gray-600 mb-4">
        {error || 'Entre em contato com o suporte.'}
      </p>
      <Button onClick={() => window.location.reload()}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Tentar Novamente
      </Button>
    </div>
  );
}
