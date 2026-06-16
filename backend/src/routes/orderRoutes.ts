import { Router } from 'express';
import { 
  placeOrder, 
  getAllOrders, 
  getOrdersByTable, 
  updateOrderStatus, 
  updateOrderPayment 
} from '../controllers/orderController';

const router = Router();

router.post('/', placeOrder);
router.get('/', getAllOrders);
router.get('/table/:table', getOrdersByTable);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/payment', updateOrderPayment);

export default router;
