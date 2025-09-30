import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, MapPin } from 'lucide-react';
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

  // Inicializar com termo da URL se existir
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      console.log('🔍 SearchBar: Inicializando com termo da URL:', searchParam);
      setSearchTerm(searchParam);
    }
  }, []);

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
    console.log('💾 Carregando pesquisas recentes:', saved);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentSearches(parsed);
        console.log('💾 Pesquisas recentes carregadas:', parsed);
      } catch (error) {
        console.error('💾 Erro ao carregar pesquisas recentes:', error);
        setRecentSearches([]);
      }
    }
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };

    if (isFocused) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isFocused]);

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
      // Se não há pesquisas recentes, mostrar sugestões populares
      if (recentSearches.length === 0) {
        setSuggestions(popularSearches.slice(0, 3));
      } else {
        setSuggestions([]);
      }
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
    
    // Se o input ficou vazio, voltar para a Home automaticamente
    if (!value.trim()) {
      onSearch('');
    }
    
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
    onSearch(''); // Limpar pesquisa na Home também
    inputRef.current?.focus();
  };

  // Pesquisa rápida por sugestão
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.text);
    handleSearch(suggestion.text);
  };

  // Colocar termo recente no input para edição
  const handleRecentClick = (term) => {
    setSearchTerm(term);
    setIsFocused(false); // Fechar dropdown
    inputRef.current?.focus(); // Focar no input
  };

  // Limpar pesquisas recentes e mostrar sugestões
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
    // Mostrar sugestões populares após limpar
    setSuggestions(popularSearches.slice(0, 3));
  };

  return (
    <div className="relative w-full">
      {/* Barra de Pesquisa Principal */}
      <div className={`relative rounded-lg transition-all duration-200 h-12 ${isFocused ? 'bg-white shadow-sm border-2 border-gray-300' : 'bg-gray-100 border-2 border-gray-200'}`}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            // Sempre gerar sugestões quando focar
            generateSuggestions(searchTerm);
          }}
          onBlur={(e) => {
            // Só fechar se não for um clique em um elemento do dropdown
            const relatedTarget = e.relatedTarget;
            if (relatedTarget && inputRef.current?.parentElement?.contains(relatedTarget)) {
              return; // Não fechar se o foco foi para um elemento dentro do dropdown
            }
            // Delay maior para permitir cliques nos botões
            setTimeout(() => setIsFocused(false), 100);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
            if (e.key === 'Escape') {
              setIsFocused(false);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 text-sm bg-transparent placeholder:text-gray-500 h-12 outline-none border-none focus:outline-none py-2"
        />
        
        {/* Botão Limpar (X) */}
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full hover:bg-gray-200 z-10"
          >
            <X className="w-3 h-3 text-gray-400" />
          </Button>
        )}
        
        {/* Botão de Pesquisa */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            handleSearch();
          }}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full hover:bg-gray-200 z-10"
        >
          <Search className="w-4 h-4 text-gray-400" />
        </Button>
      </div>

      {/* Dropdown de Sugestões - Melhorado para Mobile */}
      {isFocused && (suggestions.length > 0 || recentSearches.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Pesquisas Recentes */}
          {recentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-700">Pesquisas Recentes</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevenir que o input perca o foco
                    clearRecentSearches();
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 h-6 px-2"
                >
                  Limpar
                </Button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((term, index) => (
                  <button
                    key={index}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevenir que o input perca o foco
                      handleRecentClick(term);
                    }}
                    className="w-full text-left px-2 py-2 rounded hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sugestões Populares */}
          {suggestions.length > 0 && (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-semibold text-gray-700">Sugestões</span>
              </div>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevenir que o input perca o foco
                      handleSuggestionClick(suggestion);
                    }}
                    className="w-full text-left px-2 py-2 rounded hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <span className="text-base">{suggestion.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{suggestion.text}</div>
                      <div className="text-xs text-gray-500">{suggestion.category}</div>
                    </div>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      Popular
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dica de Pesquisa */}
          <div className="p-3 bg-gray-50 rounded-b-lg">
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
