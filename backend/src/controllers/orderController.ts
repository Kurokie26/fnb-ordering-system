import { Request, Response } from 'express';
import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const placeOrder = async (req: Request, res: Response) => {
  const { table, items, total, etaMinutes, etaTimestamp } = req.body;

  try {
    const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        table,
        total,
        etaMinutes,
        etaTimestamp: etaTimestamp ? new Date(etaTimestamp) : null,
        items: {
          create: items.map((item: any) => ({
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            note: item.note,
          })),
        },
      },
      include: { items: true },
    });

    // Notify staff via Socket.io
    const io = req.app.get('io');
    io.emit('new-order', newOrder);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to place order' });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getOrdersByTable = async (req: Request, res: Response) => {
  const { table } = req.params;
  try {
    const orders = await prisma.order.findMany({
      where: { table },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch table orders' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { 
        status: status as OrderStatus,
        closedAt: status === 'COMPLETED' ? new Date() : null,
      },
      include: { items: true },
    });

    // Notify guest and other staff
    const io = req.app.get('io');
    io.emit('order-update', updatedOrder);

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

export const updateOrderPayment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentStatus, paymentMethod } = req.body;

  try {
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { 
        paymentStatus,
        paymentMethod,
        status: paymentStatus === 'PAID' || paymentMethod === 'CHECKOUT' ? 'COMPLETED' : undefined,
        closedAt: (paymentStatus === 'PAID' || paymentMethod === 'CHECKOUT') ? new Date() : undefined,
      },
    });

    // If checkout, create Folio item
    if (paymentMethod === 'CHECKOUT') {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (order) {
        await prisma.folioItem.create({
          data: {
            orderId: order.id,
            table: order.table,
            amount: order.total,
            itemsSummary: order.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
          },
        });
      }
    }

    const io = req.app.get('io');
    io.emit('order-update', updatedOrder);

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment' });
  }
};
