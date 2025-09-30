import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SearchBar = ({ onSearch, placeholder = "Buscar restaurantes, pratos ou categorias..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Sugestões de pesquisa populares
  const popularSearches = [
    { text: "Pizza", category: "Comida", icon: "🍕" },
    { text: "Hambúrguer", category: "Comida", icon: "🍔" },
    { text: "Sushi", category: "Comida", icon: "🍣" },
    { text: "Açaí", category: "Sobremesa", icon: "🥤" },
    { text: "Padaria", category: "Categoria", icon: "🥖" },
    { text: "Japonesa", category: "Categoria", icon: "🍱" },
  ];

  // Carregar pesquisas recentes do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Salvar pesquisas recentes
  const saveRecentSearch = (term) => {
    if (!term.trim()) return;
    
    const newRecent = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
  };

  // Gerar sugestões baseadas no termo de pesquisa
  const generateSuggestions = (term) => {
    if (!term.trim()) {
      setSuggestions([]);
      return;
    }

    const filtered = popularSearches.filter(item => 
      item.text.toLowerCase().includes(term.toLowerCase())
    );
    setSuggestions(filtered);
  };

  // Debounce da pesquisa
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      generateSuggestions(value);
    }, 300);
  };

  // Executar pesquisa
  const handleSearch = (term = searchTerm) => {
    if (!term.trim()) return;
    
    setIsLoading(true);
    saveRecentSearch(term);
    onSearch(term);
    
    // Simular loading
    setTimeout(() => {
      setIsLoading(false);
      setIsFocused(false);
    }, 500);
  };

  // Limpar pesquisa
  const clearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // Pesquisa rápida por sugestão
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.text);
    handleSearch(suggestion.text);
  };

  // Pesquisa rápida por termo recente
  const handleRecentClick = (term) => {
    setSearchTerm(term);
    handleSearch(term);
  };

  // Limpar pesquisas recentes
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Barra de Pesquisa Principal */}
      <div className="relative rounded-2xl shadow-lg focus-within:shadow-xl transition-all duration-200 h-[56px]">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
            if (e.key === 'Escape') {
              setIsFocused(false);
            }
          }}
          placeholder={placeholder}
          className="pl-12 pr-20 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-0 bg-white placeholder:text-gray-400 h-[56px] focus:border-orange-500"
        />
        
        {/* Botão Limpar (X) */}
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full hover:bg-gray-100 z-10"
          >
            <X className="w-4 h-4 text-gray-400" />
          </Button>
        )}

        {/* Botão de Pesquisa */}
        <Button
          onClick={() => handleSearch()}
          disabled={!searchTerm.trim() || isLoading}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-3 py-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 z-10 h-[56px]"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Dropdown de Sugestões */}
      {isFocused && (suggestions.length > 0 || recentSearches.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          {/* Pesquisas Recentes */}
          {recentSearches.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">Pesquisas Recentes</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Limpar
                </Button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentClick(term)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                  >
                    <Clock className="w-3 h-3 text-gray-400" />
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sugestões Populares */}
          {suggestions.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Sugestões</span>
              </div>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-3"
                  >
                    <span className="text-lg">{suggestion.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{suggestion.text}</div>
                      <div className="text-xs text-gray-500">{suggestion.category}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Popular
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dica de Pesquisa */}
          <div className="p-4 bg-gray-50 rounded-b-2xl">
            <div className="text-xs text-gray-500 text-center">
              💡 <strong>Dica:</strong> Tente pesquisar por "pizza", "hambúrguer" ou "japonesa"
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SearchBar;
