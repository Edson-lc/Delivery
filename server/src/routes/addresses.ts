import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import authenticate from '../middleware/authenticate';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Schema de validação para endereços
const addressSchema = z.object({
  nome: z.string().min(1, 'Nome do endereço é obrigatório'),
  rua: z.string().min(1, 'Rua é obrigatória'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro/Freguesia é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  cep: z.string().min(1, 'Código postal é obrigatório'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

// GET /api/addresses - Listar endereços do usuário
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const addresses = await prisma.endereco.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdDate: 'desc',
      },
    });

    res.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error('Erro ao buscar endereços:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/addresses - Criar novo endereço
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Validar dados do endereço
    const validatedData = addressSchema.parse(req.body);

    // Criar endereço no banco de dados
    const address = await prisma.endereco.create({
      data: {
        ...validatedData,
        userId: userId,
      },
    });

    res.status(201).json({
      success: true,
      data: address,
      message: 'Endereço criado com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    console.error('Erro ao criar endereço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/addresses/:id - Atualizar endereço
router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const addressId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o endereço pertence ao usuário
    const existingAddress = await prisma.endereco.findFirst({
      where: {
        id: addressId,
        userId: userId,
      },
    });

    if (!existingAddress) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    // Validar dados do endereço
    const validatedData = addressSchema.parse(req.body);

    // Atualizar endereço
    const address = await prisma.endereco.update({
      where: {
        id: addressId,
      },
      data: validatedData,
    });

    res.json({
      success: true,
      data: address,
      message: 'Endereço atualizado com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    console.error('Erro ao atualizar endereço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/addresses/:id - Deletar endereço
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const addressId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o endereço pertence ao usuário
    const existingAddress = await prisma.endereco.findFirst({
      where: {
        id: addressId,
        userId: userId,
      },
    });

    if (!existingAddress) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    // Deletar endereço
    await prisma.endereco.delete({
      where: {
        id: addressId,
      },
    });

    res.json({
      success: true,
      message: 'Endereço deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar endereço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
