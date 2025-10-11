import {
  LayoutDashboard,
  Store,
  Truck,
  ShoppingBag,
  BarChart3,
  Users,
} from "lucide-react";
import { createPageUrl } from "@/utils";

export const adminNavigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Restaurantes",
    url: createPageUrl("Restaurantes"),
    icon: Store,
  },
  {
    title: "Pedidos",
    url: createPageUrl("Pedidos"),
    icon: ShoppingBag,
  },
  {
    title: "Entregadores",
    url: createPageUrl("Entregadores"),
    icon: Truck,
  },
  {
    title: "Relatórios",
    url: createPageUrl("Relatorios"),
    icon: BarChart3,
  },
  {
    title: "Usuários",
    url: createPageUrl("Usuarios"),
    icon: Users,
  },
];

export const restaurantNavigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("restaurantedashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Pedidos",
    url: createPageUrl("restaurantedashboard?tab=orders"),
    icon: ShoppingBag,
  },
  {
    title: "Cardápio",
    url: createPageUrl("restaurantedashboard?tab=menu"),
    icon: Store,
  },
  {
    title: "Relatórios",
    url: createPageUrl("restaurantedashboard?tab=reports"),
    icon: BarChart3,
  },
];

export const publicPages = [
  "Home",
  "RestaurantMenu",
  "Checkout",
  "PortalEntregador",
  "CadastroEntregador",
];

export const noLayoutPages = [
  "MinhaConta",
  "PainelEntregador",
  "PerfilEntregador",
  "DefinicoesEntregador",
  "EntregasRecentes",
];

export const restaurantPages = ["restaurantedashboard", "GerirCardapio"];
