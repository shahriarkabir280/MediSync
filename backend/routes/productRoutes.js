import express from 'express';
import { doctorOnly } from '../middleware/auth.js';
import { createProduct, getProducts, getProduct,updateProduct,deleteProduct } from '../controllers/productController.js';

const router =express.Router();
router.use(doctorOnly);

router.get('/', getProducts);
router.get('/:id', getProduct); 
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;