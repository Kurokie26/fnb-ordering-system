import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMenu = async (req: Request, res: Response) => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
};

export const updateItemAvailability = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { available } = req.body;

  try {
    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: { available },
    });
    
    // Notify all clients via Socket.io
    const io = req.app.get('io');
    io.emit('menu-update', updatedItem);
    
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item availability' });
  }
};
