import { sql } from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkBlogs() {
    try {
        const slug = 'dr-jobayer-hasan';
        console.log(`🔍 Checking blogs for slug: ${slug}`);

        const result = await sql`
      SELECT bp.* 
      FROM blog_posts bp
      JOIN doctors d ON bp.doctor_id = d.id
      JOIN website_settings ws ON d.id = ws.doctor_id
      WHERE ws.url_slug = ${slug}
    `;

        if (result.length === 0) {
            console.log('❌ No blogs found for this doctor.');
        } else {
            console.log(`✅ Found ${result.length} blogs:`);
            result.forEach((blog, i) => {
                console.log(`\nBlog ${i + 1}:`);
                console.log(`- Title: ${blog.title}`);
                console.log(`- Slug: ${blog.slug}`);
                console.log(`- Featured Image: ${blog.featured_image || 'NULL'}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking blogs:', error);
        process.exit(1);
    }
}

checkBlogs();
