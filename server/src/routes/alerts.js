import { Router } from 'express';
import { prisma } from '../index.js';
import logger from '../utils/logger.js';

const router = Router();

// POST add a new alert for a product
router.post('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  const { type, destination, triggerType = 'price_drop' } = req.body;

  if (!type || !destination) {
    return res.status(400).json({ error: 'Type (email/whatsapp) and destination are required' });
  }

  try {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const alert = await prisma.alert.create({
      data: {
        type,
        destination,
        triggerType,
        productId,
      }
    });

    res.status(201).json(alert);
  } catch (error) {
    logger.error('API', 'Failed to create alert', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// DELETE remove an alert
router.delete('/:id', async (req, res) => {
  try {
    await prisma.alert.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    logger.error('API', 'Failed to delete alert', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// GET alert logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await prisma.alertLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 50,
      include: {
        alert: {
          include: {
            product: {
              select: { name: true, platform: true }
            }
          }
        }
      }
    });
    res.json(logs);
  } catch (error) {
    logger.error('API', 'Failed to fetch alert logs', error);
    res.status(500).json({ error: 'Failed to fetch alert logs' });
  }
});

export default router;
