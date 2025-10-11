import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { createPageUrl } from "@/utils";
import { LogOut, User as UserIcon, Search, X, ChefHat, Settings } from "lucide-react";
import SearchBar from "@/components/public/SearchBar";
import { useState, useEffect, memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Componente memo para o botão de logout
const LogoutButton = memo(({ onClick }) => (
  <DropdownMenuItem
    onClick={onClick}
    className="flex items-center text-red-600 focus:text-red-600 focus:bg-red-50"
  >
    <LogOut className="w-4 h-4 mr-2" />
    Terminar Sessão
  </DropdownMenuItem>
));

LogoutButton.displayName = 'LogoutButton';

export function PublicLayout({ children }) {
  const { currentUser, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRestaurantPage, setIsRestaurantPage] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Detectar se estamos na página de um restaurante ou login
  useEffect(() => {
    const checkIfRestaurantPage = () => {
      const path = location.pathname.toLowerCase();
      // Detectar página de restaurante - rota é /restaurantmenu (minúsculo)
      // Detectar página de login - rota é /login (minúsculo)
      // Detectar página de dashboard do restaurante - rota é /restaurantedashboard (minúsculo)
      const isRestaurant = path === '/restaurantmenu' || path.includes('/restaurantmenu');
      const isLogin = path === '/login' || path.includes('/login');
      const isRestaurantDashboard = path === '/restaurantedashboard' || path.includes('/restaurantedashboard');
      const shouldHideSearch = isRestaurant || isLogin || isRestaurantDashboard;
      console.log('🔍 Detecção de página:', { path, isRestaurant, isLogin, isRestaurantDashboard, shouldHideSearch });
      setIsRestaurantPage(shouldHideSearch);
    };

    checkIfRestaurantPage();
  }, [location.pathname]);
  
  const handleLogin = () => {
    window.location.href = createPageUrl("Login");
  };
  
  const handleLogout = async () => {
    await logout();
    window.location.href = createPageUrl("Home");
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    // Fechar a pesquisa mobile após pesquisar
    setShowMobileSearch(false);
    // Usar navigate em vez de window.location.href para não recarregar a página
    if (term) {
      navigate(`/Home?search=${encodeURIComponent(term)}`);
    } else {
      navigate('/Home');
    }
  };
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* Desktop Layout - Uma linha */}
          <div className="hidden md:flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href={createPageUrl("Home")} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-bold">♥</span>
                </div>
                <span className="text-xl font-bold text-gray-900">AmaEats</span>
              </a>
            </div>

            {/* Barra de Pesquisa - Centralizada (Desktop) - Só aparece fora da página de restaurante e login */}
            {!isRestaurantPage && (
              <div className="flex-1 max-w-2xl mx-8">
                <SearchBar 
                  onSearch={handleSearch}
                  placeholder="Buscar restaurantes, pratos ou categorias..."
                />
              </div>
            )}

            {/* Login/Perfil */}
            <div className="flex-shrink-0">
              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-3 py-4 px-4 hover:bg-gray-100">
                      <img
                        src={
                          currentUser.foto_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            currentUser.full_name,
                          )}&background=f3f4f6&color=111827&size=128`
                        }
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                      <span className="text-gray-700 font-medium text-sm">
                        {currentUser.full_name?.split(" ")[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <a
                        href={
                          currentUser.tipo_usuario === "entregador"
                            ? createPageUrl("PainelEntregador")
                            : currentUser.tipo_usuario === "restaurante"
                              ? createPageUrl("restaurantedashboard")
                              : createPageUrl("MinhaConta")
                        }
                        className="flex items-center"
                      >
                        <UserIcon className="w-4 h-4 mr-2" />
                        {currentUser.tipo_usuario === "restaurante" ? "Perfil do Restaurante" : "Meu Perfil"}
                      </a>
                    </DropdownMenuItem>
                    {currentUser.tipo_usuario === "restaurante" && (
                      <DropdownMenuItem asChild>
                        <a
                          href={createPageUrl("restaurantedashboard") + "?showCardapio=true"}
                          className="flex items-center"
                        >
                          <ChefHat className="w-4 h-4 mr-2" />
                          Gerir Cardápio
                        </a>
                      </DropdownMenuItem>
                    )}
                    {currentUser.tipo_usuario === "restaurante" && (
                      <DropdownMenuItem asChild>
                        <a
                          href={createPageUrl("Definicoes")}
                          className="flex items-center"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Definições
                        </a>
                      </DropdownMenuItem>
                    )}
                    <LogoutButton onClick={handleLogout} />
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={handleLogin}
                  variant="default"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                >
                  Entrar
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Layout - Duas linhas */}
          <div className="md:hidden">
            {/* Primeira linha: Logo + Login + Pesquisa */}
            <div className="flex items-center h-14 px-2">
              {/* Logo */}
              <div className="flex-shrink-0">
                <a href={createPageUrl("Home")} className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">♥</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">AmaEats</span>
                </a>
              </div>

              {/* Spacer para empurrar elementos para a direita */}
              <div className="flex-1"></div>

              {/* Ícone de Pesquisa - Só aparece fora da página de restaurante e login, quando pesquisa não está visível */}
              {!isRestaurantPage && !showMobileSearch && (
                <div className="flex-shrink-0 mr-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowMobileSearch(true)}
                    className="p-2 hover:bg-gray-100"
                  >
                    <Search className="w-5 h-5 text-gray-600" />
                  </Button>
                </div>
              )}

              {/* Login/Perfil */}
              <div className="flex-shrink-0">
                {currentUser ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 py-4 px-4 hover:bg-gray-100">
                        <img
                          src={
                            currentUser.foto_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              currentUser.full_name,
                            )}&background=f3f4f6&color=111827&size=128`
                          }
                          alt="avatar"
                          className="w-7 h-7 rounded-full object-cover border border-gray-200"
                        />
                        <span className="text-gray-700 font-medium text-xs">
                          {currentUser.full_name?.split(" ")[0]}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <a
                          href={
                            currentUser.tipo_usuario === "entregador"
                              ? createPageUrl("PainelEntregador")
                              : currentUser.tipo_usuario === "restaurante"
                                ? createPageUrl("restaurantedashboard")
                                : createPageUrl("MinhaConta")
                          }
                          className="flex items-center"
                        >
                          <UserIcon className="w-4 h-4 mr-2" />
                          {currentUser.tipo_usuario === "restaurante" ? "Perfil do Restaurante" : "Meu Perfil"}
                        </a>
                      </DropdownMenuItem>
                      {currentUser.tipo_usuario === "restaurante" && (
                        <DropdownMenuItem asChild>
                          <a
                            href={createPageUrl("restaurantedashboard") + "?showCardapio=true"}
                            className="flex items-center"
                          >
                            <ChefHat className="w-4 h-4 mr-2" />
                            Gerir Cardápio
                          </a>
                        </DropdownMenuItem>
                      )}
                      {currentUser.tipo_usuario === "restaurante" && (
                        <DropdownMenuItem asChild>
                          <a
                            href={createPageUrl("Definicoes")}
                            className="flex items-center"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Definições
                          </a>
                        </DropdownMenuItem>
                      )}
                      <LogoutButton onClick={handleLogout} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    onClick={handleLogin}
                    variant="default"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm"
                  >
                    Entrar
                  </Button>
                )}
              </div>
            </div>

            {/* Segunda linha: Barra de Pesquisa Expandida - Só aparece quando clicada e fora da página de restaurante e login */}
            {!isRestaurantPage && showMobileSearch && (
              <div className="px-3 pb-3 bg-white">
                <div className="flex items-center gap-2">
                  <SearchBar 
                    onSearch={handleSearch}
                    placeholder="Buscar restaurantes..."
                  />
                  <Button
                    variant="ghost"
                    onClick={() => setShowMobileSearch(false)}
                    className="p-2 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">AmaEats</h3>
              <p className="text-gray-300 text-sm">
                A melhor plataforma de delivery para restaurantes e clientes.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Sobre Nós
                  </a>
                </li>
                <li>
                  <a href={createPageUrl("PortalEntregador")} className="text-gray-300 hover:text-white">
                    Seja um Entregador/a
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Ajuda e Suporte
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
              <p className="text-gray-300 text-sm">contact@amaeats.com</p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-6 mt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} AmaEats. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
