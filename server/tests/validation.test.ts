import { 
  createUserSchema, 
  loginSchema, 
  createRestaurantSchema,
  createOrderSchema,
  validateSchema 
} from '../src/schemas/validation';

describe('Validation Schemas', () => {
  describe('createUserSchema', () => {
    it('should validate correct user data', () => {
      const validUser = {
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'password123',
        telefone: '+351 123 456 789',
        nif: '123456789',
      };

      expect(() => validateSchema(createUserSchema, validUser)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidUser = {
        email: 'invalid-email',
        fullName: 'Test User',
        password: 'password123',
      };

      expect(() => validateSchema(createUserSchema, invalidUser)).toThrow();
    });

    it('should reject short password', () => {
      const invalidUser = {
        email: 'test@example.com',
        fullName: 'Test User',
        password: '123',
      };

      expect(() => validateSchema(createUserSchema, invalidUser)).toThrow();
    });

    it('should reject invalid NIF', () => {
      const invalidUser = {
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'password123',
        nif: '123',
      };

      expect(() => validateSchema(createUserSchema, invalidUser)).toThrow();
    });

    it('should reject invalid phone', () => {
      const invalidUser = {
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'password123',
        telefone: 'invalid-phone',
      };

      expect(() => validateSchema(createUserSchema, invalidUser)).toThrow();
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'password123',
      };

      expect(() => validateSchema(loginSchema, validLogin)).not.toThrow();
    });

    it('should reject empty password', () => {
      const invalidLogin = {
        email: 'test@example.com',
        password: '',
      };

      expect(() => validateSchema(loginSchema, invalidLogin)).toThrow();
    });

    it('should reject invalid email', () => {
      const invalidLogin = {
        email: 'invalid-email',
        password: 'password123',
      };

      expect(() => validateSchema(loginSchema, invalidLogin)).toThrow();
    });
  });

  describe('createRestaurantSchema', () => {
    it('should validate correct restaurant data', () => {
      const validRestaurant = {
        nome: 'Test Restaurant',
        endereco: 'Test Address 123',
        telefone: '+351 123 456 789',
        categoria: 'brasileira',
        tempoPreparo: 30,
        taxaEntrega: 2.5,
        valorMinimo: 10,
      };

      expect(() => validateSchema(createRestaurantSchema, validRestaurant)).not.toThrow();
    });

    it('should reject short name', () => {
      const invalidRestaurant = {
        nome: 'A',
        endereco: 'Test Address 123',
        telefone: '+351 123 456 789',
      };

      expect(() => validateSchema(createRestaurantSchema, invalidRestaurant)).toThrow();
    });

    it('should reject short address', () => {
      const invalidRestaurant = {
        nome: 'Test Restaurant',
        endereco: 'Test',
        telefone: '+351 123 456 789',
      };

      expect(() => validateSchema(createRestaurantSchema, invalidRestaurant)).toThrow();
    });

    it('should reject negative values', () => {
      const invalidRestaurant = {
        nome: 'Test Restaurant',
        endereco: 'Test Address 123',
        telefone: '+351 123 456 789',
        taxaEntrega: -1,
        valorMinimo: -5,
      };

      expect(() => validateSchema(createRestaurantSchema, invalidRestaurant)).toThrow();
    });
  });

  describe('createOrderSchema', () => {
    it('should validate correct order data', () => {
      const validOrder = {
        restaurantId: '123e4567-e89b-12d3-a456-426614174000',
        clienteNome: 'Test Customer',
        clienteTelefone: '+351 123 456 789',
        enderecoEntrega: { street: 'Test Street', number: '123' },
        itens: [{ name: 'Test Item', price: 10, quantity: 1 }],
        subtotal: 10,
        total: 12.5,
        taxaEntrega: 2.5,
      };

      expect(() => validateSchema(createOrderSchema, validOrder)).not.toThrow();
    });

    it('should reject empty items array', () => {
      const invalidOrder = {
        restaurantId: '123e4567-e89b-12d3-a456-426614174000',
        clienteNome: 'Test Customer',
        clienteTelefone: '+351 123 456 789',
        enderecoEntrega: { street: 'Test Street' },
        itens: [],
        subtotal: 0,
        total: 0,
      };

      expect(() => validateSchema(createOrderSchema, invalidOrder)).toThrow();
    });

    it('should reject invalid UUID', () => {
      const invalidOrder = {
        restaurantId: 'invalid-uuid',
        clienteNome: 'Test Customer',
        clienteTelefone: '+351 123 456 789',
        enderecoEntrega: { street: 'Test Street' },
        itens: [{ name: 'Test Item', price: 10 }],
        subtotal: 10,
        total: 10,
      };

      expect(() => validateSchema(createOrderSchema, invalidOrder)).toThrow();
    });

    it('should reject zero total', () => {
      const invalidOrder = {
        restaurantId: '123e4567-e89b-12d3-a456-426614174000',
        clienteNome: 'Test Customer',
        clienteTelefone: '+351 123 456 789',
        enderecoEntrega: { street: 'Test Street' },
        itens: [{ name: 'Test Item', price: 10 }],
        subtotal: 10,
        total: 0,
      };

      expect(() => validateSchema(createOrderSchema, invalidOrder)).toThrow();
    });
  });
});
