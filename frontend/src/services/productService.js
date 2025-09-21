import { productAPI } from '../config/api';

// Get all products
export const getProducts = async () => {
  try {
    const response = await productAPI.getAll();
    return response.data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Get single product by ID
export const getProductById = async (id) => {
  try {
    const response = await productAPI.getById(id);
    return response.data || null;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

// Create a new product (admin only)
export const createProduct = async (productData) => {
  try {
    const response = await productAPI.create(productData);
    return response.data || null;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update a product (admin only)
export const updateProduct = async (id, productData) => {
  try {
    const response = await productAPI.update(id, productData);
    return response.data || null;
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
};

// Delete a product (admin only)
export const deleteProduct = async (id) => {
  try {
    await productAPI.delete(id);
    return true;
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
};

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
