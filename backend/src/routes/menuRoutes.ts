import { Router } from 'express';
import { getMenu, updateItemAvailability } from '../controllers/menuController';

const router = Router();

router.get('/', getMenu);
router.patch('/:id/availability', updateItemAvailability);

export default router;
