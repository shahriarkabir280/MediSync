import {sql} from '../config/db.js'; // Import the database connection

export const getProducts = async(req, res) => {
      try {
       const products = await sql`
          SELECT * FROM products
          ORDER BY created_at DESC
        `;
        console.log('Products fetched successfully',products);
        res.status(200).json({
            success: true,
            data: products
        })
      }catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success : fasle, message: 'Internal Server Error' });
      }
};


export const createProduct = async(req, res) => {
       const { name, image_url, price } = req.body;
       if (!name || !image_url || !price) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
       }

       try {
             const newProduct = await sql`
              INSERT INTO products (name, image_url, price)
              VALUES (${name},${image_url},${price})
              RETURNING *`;
              //console.log('Product created successfully', newProduct);
              res.status(201).json({success: true, data: newProduct[0]});
       } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
       }
};



export const getProduct = async(req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    try {
        const product = await sql`
            SELECT * FROM products WHERE id = ${id}
        `;

        if (product.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, data: product[0] });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};



export const updateProduct = async(req, res) => {
    const { id } = req.params;
    const { name, image_url, price } = req.body;
    if( !id || !name || !image_url || !price) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        const updatedProduct = await sql`
            UPDATE products
            SET name = ${name}, image_url = ${image_url}, price = ${price}
            WHERE id = ${id}
            RETURNING *
        `;
        if( updatedProduct.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.status(200).json({ success: true, data: updatedProduct[0] });   
    }catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};



export const deleteProduct = async(req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    try {
        const deletedProduct = await sql`
            DELETE FROM products WHERE id = ${id} RETURNING *
        `;

        if (deletedProduct.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, data: deletedProduct[0] });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}; 