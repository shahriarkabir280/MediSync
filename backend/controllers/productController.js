import { supabase } from '../config/db.js'; // Import the database connection

export const getProducts = async (req, res) => {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('Products fetched successfully', products);
        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


export const createProduct = async (req, res) => {
    const { name, image_url, price } = req.body;
    if (!name || !image_url || !price) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        const { data: newProduct, error } = await supabase
            .from('products')
            .insert({ name, image_url, price })
            .select()
            .single();

        if (error) throw error;

        //console.log('Product created successfully', newProduct);
        res.status(201).json({ success: true, data: newProduct });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



export const getProduct = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    try {
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};



export const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, image_url, price } = req.body;
    if (!id || !name || !image_url || !price) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        const { data: updatedProduct, error } = await supabase
            .from('products')
            .update({ name, image_url, price })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.status(200).json({ success: true, data: updatedProduct });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};



export const deleteProduct = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    try {
        const { data: deletedProduct, error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, data: deletedProduct });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}; 