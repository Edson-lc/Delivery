import { apiRequest, toSnakeCase, toCamelCaseKey, transformKeysShallow } from './httpClient';
import { readAuth, writeAuth, clearAuth, getStoredUser, getAuthToken } from './session';

function normalizeResponse(data) {
  return toSnakeCase(data);
}

function buildQuery(filter = {}, options = {}) {
  const query = {};

  if (filter && typeof filter === 'object') {
    Object.entries(filter).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      query[toCamelCaseKey(key)] = value;
    });
  }

  const { limit, skip, sort, search } = options;
  if (limit !== undefined) query.limit = limit;
  if (skip !== undefined) query.skip = skip;
  if (sort !== undefined) query.sort = sort;
  if (search !== undefined) query.search = search;

  return query;
}

function mapBody(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }
  return transformKeysShallow(payload, toCamelCaseKey);
}

function createEntityClient(resource) {
  return {
    async list(sort, limit, skip) {
      const query = buildQuery({}, { sort, limit, skip });
      const data = await apiRequest(`/${resource}`, { query });
      return normalizeResponse(data);
    },
    async filter(filter = {}, sort, limit, skip) {
      const query = buildQuery(filter, { sort, limit, skip });
      const data = await apiRequest(`/${resource}`, { query });
      return normalizeResponse(data);
    },
    async get(id) {
      const data = await apiRequest(`/${resource}/${id}`);
      return normalizeResponse(data);
    },
    async create(payload) {
      const body = mapBody(payload);
      const data = await apiRequest(`/${resource}`, {
        method: 'POST',
        body,
      });
      return normalizeResponse(data);
    },
    async update(id, payload) {
      const body = mapBody(payload);
      const data = await apiRequest(`/${resource}/${id}`, {
        method: 'PUT',
        body,
      });
      return normalizeResponse(data);
    },
    async delete(id) {
      await apiRequest(`/${resource}/${id}`, { method: 'DELETE' });
      return true;
    },
  };
}

export const Restaurant = {
  ...createEntityClient('restaurants'),
  async filter(filter = {}, sort, limit, skip) {
    const query = buildQuery(filter, { sort, limit, skip });
    const data = await apiRequest('/restaurants', {
      query,
    });
    return normalizeResponse(data);
  },
};

export const MenuItem = createEntityClient('menu-items');
export const Order = createEntityClient('orders');
const baseCartClient = createEntityClient('carts');

function getCartAccess() {
  const auth = readAuth();
  const token = auth?.token ?? null;
  const role = auth?.user?.role ?? null;
  const tipoUsuario = auth?.user?.tipo_usuario ?? auth?.user?.tipoUsuario ?? null;
  const canUsePrivate = Boolean(token && (role === 'admin' || tipoUsuario === 'restaurante'));
  return { token, canUsePrivate };
}

function resolveCartEndpoint(subPath = '') {
  const { canUsePrivate } = getCartAccess();
  const base = canUsePrivate ? '/carts' : '/public/carts';
  return base + subPath;
}

async function requestCartWithQuery(filter = {}, sort, limit, skip) {
  const path = resolveCartEndpoint('');
  const query = buildQuery(filter, { sort, limit, skip });
  const data = await apiRequest(path, { query });
  return normalizeResponse(data);
}

export const Cart = {
  ...baseCartClient,
  async list(sort, limit, skip) {
    return requestCartWithQuery({}, sort, limit, skip);
  },
  async filter(filter = {}, sort, limit, skip) {
    return requestCartWithQuery(filter, sort, limit, skip);
  },
  async get(id) {
    const { canUsePrivate } = getCartAccess();

    if (canUsePrivate) {
      const data = await apiRequest('/carts/' + id);
      return normalizeResponse(data);
    }

    const data = await apiRequest('/public/carts', { query: { id } });
    const normalized = normalizeResponse(data);
    if (Array.isArray(normalized)) {
      return normalized[0] ?? null;
    }
    return normalized;
  },
  async create(payload) {
    const body = mapBody(payload);
    const path = resolveCartEndpoint('');
    const data = await apiRequest(path, {
      method: 'POST',
      body,
    });
    return normalizeResponse(data);
  },
  async update(id, payload) {
    const body = mapBody(payload);
    const path = resolveCartEndpoint('/' + id);
    const data = await apiRequest(path, {
      method: 'PUT',
      body,
    });
    return normalizeResponse(data);
  },
  async delete(id) {
    const { canUsePrivate } = getCartAccess();
    if (!canUsePrivate) {
      throw new Error('Operacao de exclusao de carrinho requer perfil administrativo.');
    }
    await apiRequest('/carts/' + id, { method: 'DELETE' });
    return true;
  },
};
export const Customer = createEntityClient('customers');
export const Entregador = createEntityClient('entregadores');
export const Delivery = createEntityClient('deliveries');
export const AlteracaoPerfil = createEntityClient('alteracoes-perfil');

export const User = {
  async register(payload) {
    const body = mapBody(payload);
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body,
    });
    const normalized = normalizeResponse(data);
    const token = normalized?.token;
    const user = normalized?.user;
    if (token && user) {
      writeAuth({ token, user });
    }
    return user;
  },
  async me() {
    const currentAuth = readAuth();
    if (!currentAuth?.token) {
      return null;
    }
    try {
      const data = await apiRequest('/auth/me');
      const user = normalizeResponse(data);
      writeAuth({ ...currentAuth, user });
      return user;
    } catch (error) {
      if (error?.status === 401) {
        clearAuth();
        return null;
      }
      const stored = getStoredUser();
      if (stored) {
        console.warn('Failed to refresh stored user, falling back to local copy', error);
      }
      return stored;
    }
  },
  async list(sort, limit, skip) {
    const data = await apiRequest('/users', { query: buildQuery({}, { sort, limit, skip }) });
    return normalizeResponse(data);
  },
  async create(payload) {
    const body = mapBody(payload);
    const data = await apiRequest('/users', {
      method: 'POST',
      body,
    });
    return normalizeResponse(data);
  },
  async update(id, payload) {
    const body = mapBody(payload);
    const data = await apiRequest(`/users/${id}`, {
      method: 'PUT',
      body,
    });
    const user = normalizeResponse(data);
    const auth = readAuth();
    if (auth?.user?.id === user.id) {
      writeAuth({ ...auth, user });
    }
    return user;
  },
  async updateMyUserData(payload) {
    const user = await User.me();
    if (!user) {
      throw new Error('No authenticated user');
    }
    return User.update(user.id, payload);
  },
  async login(credentials) {
    const creds = credentials;

    if (!creds) {
      if (typeof window !== 'undefined') {
        const current = window.location.pathname + window.location.search + window.location.hash;
        const q = `?redirect=${encodeURIComponent(current)}`;
        window.location.href = `/Login${q}`;
        return null;
      }
      throw new Error('Credenciais ausentes. Utilize a pÃ¡gina /Login.');
    }

    const normalizedCreds = {
      email: String(creds.email ?? '').trim().toLowerCase(),
      password: String(creds.password ?? ''),
    };

    if (!normalizedCreds.email) {
      throw new Error('Informe um e-mail vÃ¡lido.');
    }

    if (!normalizedCreds.password) {
      throw new Error('Informe a sua senha.');
    }

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: normalizedCreds,
      });
      const normalized = normalizeResponse(data);
      const userPayload = normalized?.user ?? normalized?.data?.user;
      const user = userPayload ? normalizeResponse(userPayload) : null;
      const token = normalized?.token ?? data?.token;
      if (!user || !token) {
        throw new Error('Resposta de autenticaÃ§Ã£o incompleta.');
      }
      writeAuth({ user, token });
      return user;
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        throw new Error('Credenciais invÃ¡lidas. Verifique o e-mail e a senha informados.');
      }
      if (error?.status === 400) {
        throw new Error(error?.message || 'E-mail e senha sÃ£o obrigatÃ³rios.');
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('NÃ£o foi possÃ­vel autenticar. Tente novamente mais tarde.');
    }
  },
  async loginWithRedirect(redirectUrl) {
    if (typeof window !== 'undefined') {
      const q = redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : '';
      window.location.href = `/Login${q}`;
      return null;
    }
    throw new Error('loginWithRedirect requer ambiente de navegador.');
  },
  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      // Ignorar erros de logout
    }
    clearAuth();
    return true;
  },
};

