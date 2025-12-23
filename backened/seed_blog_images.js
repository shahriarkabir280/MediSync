import { sql } from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function seedBlogImages() {
    try {
        const slug = 'dr-jobayer-hasan';
        console.log(`🌱 Seeding featured images for blogs of: ${slug}`);

        // High quality medical images from Unsplash
        const medicalImages = [
            'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&auto=format&fit=crop', // Stethoscope
            'https://images.unsplash.com/photo-1584362924011-5c957008fdec?w=800&auto=format&fit=crop', // Doctor checking heart
            'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&auto=format&fit=crop'  // Medical consultation
        ];

        const blogs = await sql`
      SELECT bp.id 
      FROM blog_posts bp
      JOIN doctors d ON bp.doctor_id = d.id
      JOIN website_settings ws ON d.id = ws.doctor_id
      WHERE ws.url_slug = ${slug}
      ORDER BY bp.created_at DESC
    `;

        if (blogs.length === 0) {
            console.log('❌ No blogs found.');
            process.exit(0);
        }

        for (let i = 0; i < blogs.length; i++) {
            const imageUrl = medicalImages[i % medicalImages.length];
            await sql`
            UPDATE blog_posts 
            SET featured_image = ${imageUrl}
            WHERE id = ${blogs[i].id}
        `;
            console.log(`✅ Updated blog ${blogs[i].id} with image: ${imageUrl}`);
        }

        console.log('✨ All blogs updated with featured images.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding blog images:', error);
        process.exit(1);
    }
}

seedBlogImages();
