import { sql } from '../config/db.js';
import { saveBase64Image, deleteOldImage, isBase64Image } from '../utils/imageUtils.js';

// Simple in-memory cache for better performance
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Public website system - designed for ONE DOCTOR per deployment
// All data is associated with a single doctor ID
const getCacheKey = (prefix, id) => `${prefix}:${id}`;

const getFromCache = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

const clearCachePattern = (pattern) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

// Get complete doctor profile with all related data
export const getDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log(`🏥 Loading public website data for Doctor ID: ${doctorId}`);
    console.log('📝 Note: This public website system is designed for ONE doctor per deployment');

    const cacheKey = getCacheKey('profile', doctorId);

    // Check cache first
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    // Get basic doctor and website settings first
    const basicProfile = await sql`
      SELECT 
        d.*,
        ws.title,
        ws.tagline,
        ws.description,
        ws.theme_color,
        ws.layout_style,
        ws.show_phone,
        ws.show_email,
        ws.show_address,
        ws.show_appointment,
        ws.show_social,
        ws.meta_keywords,
        ws.url_slug,
        ws.visibility,
        ws.hero,
        ws.about,
        ws.stats
      FROM doctors d
      LEFT JOIN website_settings ws ON d.id = ws.doctor_id
      WHERE d.id = ${doctorId}
    `;

    if (basicProfile.length === 0) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    // Get related data separately to avoid Cartesian product
    const [education, experience, services, chambers, socialMedia] = await Promise.all([
      sql`SELECT * FROM doctor_education WHERE doctor_id = ${doctorId} ORDER BY passing_year DESC`,
      sql`SELECT * FROM doctor_experience WHERE doctor_id = ${doctorId} ORDER BY start_date DESC`,
      sql`SELECT * FROM doctor_services WHERE doctor_id = ${doctorId} ORDER BY id`,
      sql`SELECT * FROM doctor_chambers WHERE doctor_id = ${doctorId} ORDER BY id`,
      sql`SELECT * FROM doctor_social_media WHERE doctor_id = ${doctorId} ORDER BY platform`
    ]);

    const profileData = {
      ...basicProfile[0],
      education: education || [],
      experience: experience || [],
      services: services || [],
      chambers: chambers || [],
      social_media: socialMedia || []
    };

    // Get testimonials separately for better performance
    const testimonials = await sql`
      SELECT * FROM doctor_testimonials 
      WHERE doctor_id = ${doctorId} 
      ORDER BY feedback_date DESC
    `;

    // Get sponsors separately
    const sponsors = await sql`
      SELECT * FROM doctor_sponsors 
      WHERE doctor_id = ${doctorId} 
      ORDER BY start_date DESC
    `;

    const result = {
      ...profileData,
      testimonials,
      affiliates: sponsors // Map sponsors to affiliates for frontend
    };

    // Cache the result
    setCache(cacheKey, result);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ error: 'Failed to fetch doctor profile' });
  }
};

// Update doctor profile with optimized batch operations
export const updateDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const profileData = req.body;

    console.log('Updating doctor profile for ID:', doctorId);
    console.log('Profile data received:', JSON.stringify(profileData, null, 2));

    // Handle profile image - convert base64 to file if needed
    let profileImageUrl = profileData.profile_photo_url;

    if (isBase64Image(profileImageUrl)) {
      console.log('🖼️  Converting base64 image to file...');
      console.log('📏 Base64 length:', profileImageUrl.length);
      console.log('📋 Base64 preview:', profileImageUrl.substring(0, 50) + '...');

      try {
        // Get current image URL to delete old file
        const currentDoctor = await sql`SELECT profile_image_url FROM doctors WHERE id = ${doctorId}`;
        if (currentDoctor.length > 0 && currentDoctor[0].profile_image_url) {
          console.log('🗑️  Deleting old image:', currentDoctor[0].profile_image_url);
          deleteOldImage(currentDoctor[0].profile_image_url);
        }

        // Save new image and get file URL
        profileImageUrl = saveBase64Image(profileImageUrl, doctorId);
        console.log('✅ Image saved as:', profileImageUrl);
      } catch (error) {
        console.error('❌ Error processing image:', error);
        throw new Error(`Image processing failed: ${error.message}`);
      }
    } else {
      console.log('🔗 Using URL image:', profileImageUrl);
    }

    // Update basic doctor info
    await sql`
      UPDATE doctors SET
        first_name = ${profileData.full_name?.split(' ')[0] || ''},
        last_name = ${profileData.full_name?.split(' ').slice(1).join(' ') || ''},
        profile_image_url = ${profileImageUrl || null},
        years_of_experience = ${profileData.years_experience || 0},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${doctorId}
    `;
    // Update website settings
    if (profileData.website) {
      console.log('Updating website settings:', profileData.website);

      // Prepare website data with defaults
      const websiteData = {
        title: profileData.website.title || '',
        tagline: profileData.website.tagline || '',
        description: profileData.website.description || '',
        theme_color: profileData.website.theme_color || '#2563eb',
        layout_style: profileData.website.layout_style || 'modern',
        show_phone: profileData.website.show_phone !== undefined ? profileData.website.show_phone : true,
        show_email: profileData.website.show_email !== undefined ? profileData.website.show_email : true,
        show_address: profileData.website.show_address !== undefined ? profileData.website.show_address : true,
        show_appointment: profileData.website.show_appointment !== undefined ? profileData.website.show_appointment : true,
        show_social: profileData.website.show_social !== undefined ? profileData.website.show_social : true,
        meta_keywords: profileData.website.meta_keywords || '',
        url_slug: profileData.website.url_slug || 'doctor',
        visibility: profileData.website.visibility !== undefined ? profileData.website.visibility : true
      };

      // Check if website record exists for this doctor
      const existingWebsite = await sql`SELECT id FROM website_settings WHERE doctor_id = ${doctorId}`;

      if (existingWebsite.length > 0) {
        // Update existing website record
        await sql`
          UPDATE website_settings SET
            title = ${websiteData.title},
            tagline = ${websiteData.tagline},
            description = ${websiteData.description},
            theme_color = ${websiteData.theme_color},
            layout_style = ${websiteData.layout_style},
            show_phone = ${websiteData.show_phone},
            show_email = ${websiteData.show_email},
            show_address = ${websiteData.show_address},
            show_appointment = ${websiteData.show_appointment},
            show_social = ${websiteData.show_social},
            meta_keywords = ${websiteData.meta_keywords},
            url_slug = ${websiteData.url_slug},
            visibility = ${websiteData.visibility},
            hero = ${JSON.stringify(profileData.hero || {})},
            about = ${JSON.stringify(profileData.about || {})},
            stats = ${JSON.stringify(profileData.stats || {})}
          WHERE doctor_id = ${doctorId}
        `;
      } else {
        // Insert new website record
        await sql`
          INSERT INTO website_settings (
            doctor_id, title, tagline, description, theme_color, layout_style,
            show_phone, show_email, show_address, show_appointment, show_social,
            meta_keywords, url_slug, visibility, hero, about, stats
          ) VALUES (
            ${doctorId}, ${websiteData.title}, ${websiteData.tagline},
            ${websiteData.description}, ${websiteData.theme_color}, ${websiteData.layout_style},
            ${websiteData.show_phone}, ${websiteData.show_email}, ${websiteData.show_address},
            ${websiteData.show_appointment}, ${websiteData.show_social}, ${websiteData.meta_keywords},
            ${websiteData.url_slug}, ${websiteData.visibility},
            ${JSON.stringify(profileData.hero || {})}, 
            ${JSON.stringify(profileData.about || {})}, 
            ${JSON.stringify(profileData.stats || {})}
          )
        `;
      }
    }

    // Batch update education
    if (profileData.education && Array.isArray(profileData.education)) {
      // Delete existing education
      await sql`DELETE FROM doctor_education WHERE doctor_id = ${doctorId}`;

      // Insert new education records
      for (const edu of profileData.education) {
        if (edu.degree && edu.institution) {
          await sql`
              INSERT INTO doctor_education (
                doctor_id, degree, institution, passing_year, short_description, type
              ) VALUES (
                ${doctorId}, ${edu.degree}, ${edu.institution}, 
                ${edu.passing_year}, ${edu.short_description}, ${edu.type || 'certification'}
              )
            `;
        }
      }
    }

    // Batch update experience
    if (profileData.experience && Array.isArray(profileData.experience)) {
      await sql`DELETE FROM doctor_experience WHERE doctor_id = ${doctorId}`;

      for (const exp of profileData.experience) {
        if (exp.designation && exp.organization) {
          // Convert empty date strings to null
          const startDate = exp.start_date && exp.start_date.trim() ? exp.start_date : null;
          const endDate = exp.end_date && exp.end_date.trim() ? exp.end_date : null;

          await sql`
              INSERT INTO doctor_experience (
                doctor_id, designation, organization, start_date, end_date, short_description, type
              ) VALUES (
                ${doctorId}, ${exp.designation}, ${exp.organization},
                ${startDate}, ${endDate}, ${exp.short_description}, ${exp.type || 'current'}
              )
            `;
        }
      }
    }

    // Batch update services
    if (profileData.services && Array.isArray(profileData.services)) {
      await sql`DELETE FROM doctor_services WHERE doctor_id = ${doctorId}`;

      for (const service of profileData.services) {
        if (service.service_name) {
          await sql`
              INSERT INTO doctor_services (
                doctor_id, service_icon, service_name, service_description, features, color_theme
              ) VALUES (
                ${doctorId}, ${service.service_icon}, ${service.service_name}, 
                ${service.service_description}, ${service.features}, ${service.color_theme || 'from-blue-500 to-cyan-500'}
              )
            `;
        }
      }
    }

    // Batch update chambers
    if (profileData.chamber && Array.isArray(profileData.chamber)) {
      await sql`DELETE FROM doctor_chambers WHERE doctor_id = ${doctorId}`;

      for (const chamber of profileData.chamber) {
        if (chamber.chamber_location) {
          await sql`
              INSERT INTO doctor_chambers (
                doctor_id, chamber_location, available_time, day
              ) VALUES (
                ${doctorId}, ${chamber.chamber_location}, ${chamber.time_range || chamber.available_time}, ${chamber.day}
              )
            `;
        }
      }
    }

    // Batch update social media
    if (profileData.social_media && Array.isArray(profileData.social_media)) {
      await sql`DELETE FROM doctor_social_media WHERE doctor_id = ${doctorId}`;

      for (const social of profileData.social_media) {
        if (social.platform && social.profile_url) {
          await sql`
              INSERT INTO doctor_social_media (
                doctor_id, platform, profile_url
              ) VALUES (
                ${doctorId}, ${social.platform}, ${social.profile_url}
              )
            `;
        }
      }
    }

    // Batch update testimonials (New)
    if (profileData.testimonials && Array.isArray(profileData.testimonials)) {
      await sql`DELETE FROM doctor_testimonials WHERE doctor_id = ${doctorId}`;

      for (const t of profileData.testimonials) {
        if (t.name) {
          await sql`
              INSERT INTO doctor_testimonials (
                doctor_id, patient_name, patient_feedback, rating, location, avatar_url
              ) VALUES (
                ${doctorId}, ${t.name}, ${t.message}, ${t.rating || 5}, ${t.location}, ${t.avatar}
              )
            `;
        }
      }
    }

    // Batch update projects/affiliates (mapped to sponsors)
    if (profileData.affiliates && Array.isArray(profileData.affiliates)) {
      await sql`DELETE FROM doctor_sponsors WHERE doctor_id = ${doctorId}`;

      for (const aff of profileData.affiliates) {
        if (aff.name) {
          await sql`
              INSERT INTO doctor_sponsors (
                doctor_id, organization_name, organization_logo
              ) VALUES (
                ${doctorId}, ${aff.name}, ${aff.logo}
              )
            `;
        }
      }
    }

    // Clear cache for this doctor
    clearCachePattern(doctorId);

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ error: 'Failed to update doctor profile' });
  }
};

// Get public profile with optimized query and caching
export const getPublicProfile = async (req, res) => {
  try {
    const { urlSlug } = req.params;
    const cacheKey = getCacheKey('public', urlSlug);

    // Check cache first
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    // Single optimized query for public profile
    const profile = await sql`
      SELECT 
        d.id,
        d.first_name || ' ' || d.last_name as full_name,
        d.profile_image_url as profile_photo_url,
        d.specialization,
        d.years_of_experience as years_experience,
        d.email,
        d.phone,
        ws.*,
        
        -- Get all related data as JSON
        (
          SELECT json_agg(json_build_object(
            'degree', degree,
            'institution', institution,
            'passing_year', passing_year,
            'short_description', short_description
          ) ORDER BY passing_year DESC)
          FROM doctor_education WHERE doctor_id = d.id
        ) as education,
        
        (
          SELECT json_agg(json_build_object(
            'designation', designation,
            'organization', organization,
            'start_date', start_date,
            'end_date', end_date,
            'short_description', short_description
          ) ORDER BY start_date DESC)
          FROM doctor_experience WHERE doctor_id = d.id
        ) as experience,
        
        (
          SELECT json_agg(json_build_object(
            'service_icon', service_icon,
            'service_name', service_name,
            'service_description', service_description,
            'features', features,
            'color_theme', color_theme
          ))
          FROM doctor_services WHERE doctor_id = d.id
        ) as services,
        
        (
          SELECT json_agg(json_build_object(
            'chamber_location', chamber_location,
            'available_time', available_time,
            'day', day
          ))
          FROM doctor_chambers WHERE doctor_id = d.id
        ) as chambers,
        
        (
          SELECT json_agg(json_build_object(
            'platform', platform,
            'profile_url', profile_url
          ))
          FROM doctor_social_media WHERE doctor_id = d.id
        ) as social_media,

        -- Get contact information
        (
          SELECT json_build_object(
            'phone', phone,
            'whatsapp', whatsapp,
            'email', email,
            'address', address,
            'emergency_contact_name', emergency_contact_name,
            'emergency_contact_phone', emergency_contact_phone,
            'office_phone', office_phone,
            'fax', fax,
            'website_url', website_url
          )
          FROM doctor_contact WHERE doctor_id = d.id
        ) as contact,
        
        (
          SELECT json_agg(json_build_object(
            'name', patient_name,
            'message', patient_feedback,
            'date', feedback_date,
            'rating', rating,
            'location', location,
            'avatar', avatar_url
          ) ORDER BY feedback_date DESC)
          FROM doctor_testimonials WHERE doctor_id = d.id
        ) as testimonials,

        (
          SELECT json_agg(json_build_object(
            'name', organization_name,
            'logo', organization_logo
          ))
          FROM doctor_sponsors WHERE doctor_id = d.id
        ) as affiliates,

        (
          SELECT json_agg(json_build_object(
            'id', id,
            'title', title,
            'slug', slug,
            'excerpt', excerpt,
            'featured_image', featured_image,
            'category', category,
            'published_at', published_at,
            'read_time', read_time,
            'views', views
          ) ORDER BY published_at DESC)
          FROM blog_posts 
          WHERE doctor_id = d.id AND status = 'published'
          LIMIT 6
        ) as blogs
        
      FROM doctors d
      JOIN website_settings ws ON d.id = ws.doctor_id
      WHERE ws.url_slug = ${urlSlug} AND ws.visibility = true
    `;

    if (profile.length === 0) {
      return res.status(404).json({ error: 'Public profile not found or not visible' });
    }

    // Cache the result for longer (public profiles don't change often)
    setCache(cacheKey, profile[0]);

    res.json({ success: true, data: profile[0] });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ error: 'Failed to fetch public profile' });
  }
};

// Upload profile image (placeholder - implement with actual file upload service)
export const uploadProfileImage = async (req, res) => {
  try {
    const { doctorId } = req.params;
    // Implement actual file upload logic here (AWS S3, Cloudinary, etc.)

    // For now, return mock URL
    const imageUrl = `https://example.com/profiles/${doctorId}/profile.jpg`;

    await sql`
      UPDATE doctors 
      SET profile_image_url = ${imageUrl}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${doctorId}
    `;

    // Clear cache
    clearCachePattern(doctorId);

    res.json({ success: true, data: { imageUrl } });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
};

// Get website settings
export const getDoctorWebsiteSettings = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const settings = await sql`
      SELECT * FROM website_settings WHERE doctor_id = ${doctorId}
    `;

    res.json({ success: true, data: settings[0] || {} });
  } catch (error) {
    console.error('Error fetching website settings:', error);
    res.status(500).json({ error: 'Failed to fetch website settings' });
  }
};

// Update website settings
export const updateWebsiteSettings = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const settings = req.body;

    // Check if website record exists
    const existing = await sql`SELECT id FROM website_settings WHERE doctor_id = ${doctorId}`;

    if (existing.length > 0) {
      // Update existing record using the same pattern as the main profile update
      const websiteData = {
        title: settings.title || '',
        tagline: settings.tagline || '',
        description: settings.description || '',
        theme_color: settings.theme_color || '#2563eb',
        layout_style: settings.layout_style || 'modern',
        show_phone: settings.show_phone !== undefined ? settings.show_phone : true,
        show_email: settings.show_email !== undefined ? settings.show_email : true,
        show_address: settings.show_address !== undefined ? settings.show_address : true,
        show_appointment: settings.show_appointment !== undefined ? settings.show_appointment : true,
        show_social: settings.show_social !== undefined ? settings.show_social : true,
        meta_keywords: settings.meta_keywords || '',
        url_slug: settings.url_slug || 'doctor',
        visibility: settings.visibility !== undefined ? settings.visibility : true
      };

      await sql`
        UPDATE website_settings SET
          title = ${websiteData.title},
          tagline = ${websiteData.tagline},
          description = ${websiteData.description},
          theme_color = ${websiteData.theme_color},
          layout_style = ${websiteData.layout_style},
          show_phone = ${websiteData.show_phone},
          show_email = ${websiteData.show_email},
          show_address = ${websiteData.show_address},
          show_appointment = ${websiteData.show_appointment},
          show_social = ${websiteData.show_social},
          meta_keywords = ${websiteData.meta_keywords},
          url_slug = ${websiteData.url_slug},
          visibility = ${websiteData.visibility}
        WHERE doctor_id = ${doctorId}
      `;
    } else {
      // Insert new record
      const websiteData = {
        title: settings.title || '',
        tagline: settings.tagline || '',
        description: settings.description || '',
        theme_color: settings.theme_color || '#2563eb',
        layout_style: settings.layout_style || 'modern',
        show_phone: settings.show_phone !== undefined ? settings.show_phone : true,
        show_email: settings.show_email !== undefined ? settings.show_email : true,
        show_address: settings.show_address !== undefined ? settings.show_address : true,
        show_appointment: settings.show_appointment !== undefined ? settings.show_appointment : true,
        show_social: settings.show_social !== undefined ? settings.show_social : true,
        meta_keywords: settings.meta_keywords || '',
        url_slug: settings.url_slug || 'doctor',
        visibility: settings.visibility !== undefined ? settings.visibility : true
      };

      await sql`
        INSERT INTO website_settings (
          doctor_id, title, tagline, description, theme_color, layout_style,
          show_phone, show_email, show_address, show_appointment, show_social,
          meta_keywords, url_slug, visibility
        ) VALUES (
          ${doctorId}, ${websiteData.title}, ${websiteData.tagline},
          ${websiteData.description}, ${websiteData.theme_color}, ${websiteData.layout_style},
          ${websiteData.show_phone}, ${websiteData.show_email}, ${websiteData.show_address},
          ${websiteData.show_appointment}, ${websiteData.show_social}, ${websiteData.meta_keywords},
          ${websiteData.url_slug}, ${websiteData.visibility}
        )
      `;
    }

    clearCachePattern(doctorId);

    res.json({ success: true, message: 'Website settings updated successfully' });
  } catch (error) {
    console.error('Error updating website settings:', error);
    res.status(500).json({ error: 'Failed to update website settings' });
  }
};

// Dashboard stats for performance monitoring
export const getDashboardStats = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const cacheKey = getCacheKey('stats', doctorId);

    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM doctor_education WHERE doctor_id = ${doctorId}) as education_count,
        (SELECT COUNT(*) FROM doctor_experience WHERE doctor_id = ${doctorId}) as experience_count,
        (SELECT COUNT(*) FROM doctor_services WHERE doctor_id = ${doctorId}) as services_count,
        (SELECT COUNT(*) FROM doctor_chambers WHERE doctor_id = ${doctorId}) as chambers_count,
        (SELECT COUNT(*) FROM doctor_testimonials WHERE doctor_id = ${doctorId}) as testimonials_count,
        (SELECT visibility FROM website_settings WHERE doctor_id = ${doctorId}) as website_visible
    `;

    setCache(cacheKey, stats[0]);

    res.json({ success: true, data: stats[0] || {} });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// Individual CRUD operations for education, experience, etc.
export const addEducation = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const education = req.body;

    const result = await sql`
      INSERT INTO doctor_education (doctor_id, degree, institution, passing_year, short_description)
      VALUES (${doctorId}, ${education.degree}, ${education.institution}, 
              ${education.passing_year}, ${education.short_description})
      RETURNING id
    `;

    clearCachePattern(doctorId);
    res.json({ success: true, data: { id: result[0].id } });
  } catch (error) {
    console.error('Error adding education:', error);
    res.status(500).json({ error: 'Failed to add education' });
  }
};

export const updateEducation = async (req, res) => {
  try {
    const { doctorId, educationId } = req.params;
    const education = req.body;

    await sql`
      UPDATE doctor_education 
      SET degree = ${education.degree}, 
          institution = ${education.institution},
          passing_year = ${education.passing_year},
          short_description = ${education.short_description}
      WHERE id = ${educationId} AND doctor_id = ${doctorId}
    `;

    clearCachePattern(doctorId);
    res.json({ success: true, message: 'Education updated successfully' });
  } catch (error) {
    console.error('Error updating education:', error);
    res.status(500).json({ error: 'Failed to update education' });
  }
};

export const deleteEducation = async (req, res) => {
  try {
    const { doctorId, educationId } = req.params;

    await sql`
      DELETE FROM doctor_education 
      WHERE id = ${educationId} AND doctor_id = ${doctorId}
    `;

    clearCachePattern(doctorId);
    res.json({ success: true, message: 'Education deleted successfully' });
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({ error: 'Failed to delete education' });
  }
};

// Similar implementations for experience, services, chambers, testimonials
// (Following same pattern for brevity)

export const addExperience = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const experience = req.body;

    const result = await sql`
      INSERT INTO doctor_experience (doctor_id, designation, organization, start_date, end_date, short_description)
      VALUES (${doctorId}, ${experience.designation}, ${experience.organization}, 
              ${experience.start_date || null}, ${experience.end_date || null}, ${experience.short_description})
      RETURNING id
    `;

    clearCachePattern(doctorId);
    res.json({ success: true, data: { id: result[0].id } });
  } catch (error) {
    console.error('Error adding experience:', error);
    res.status(500).json({ error: 'Failed to add experience' });
  }
};

export const updateExperience = async (req, res) => {
  try {
    const { doctorId, experienceId } = req.params;
    const experience = req.body;

    await sql`
      UPDATE doctor_experience 
      SET designation = ${experience.designation}, 
          organization = ${experience.organization},
          start_date = ${experience.start_date || null},
          end_date = ${experience.end_date || null},
          short_description = ${experience.short_description}
      WHERE id = ${experienceId} AND doctor_id = ${doctorId}
    `;

    clearCachePattern(doctorId);
    res.json({ success: true, message: 'Experience updated successfully' });
  } catch (error) {
    console.error('Error updating experience:', error);
    res.status(500).json({ error: 'Failed to update experience' });
  }
};

export const deleteExperience = async (req, res) => {
  try {
    const { doctorId, experienceId } = req.params;

    await sql`DELETE FROM doctor_experience WHERE id = ${experienceId} AND doctor_id = ${doctorId}`;

    clearCachePattern(doctorId);
    res.json({ success: true, message: 'Experience deleted successfully' });
  } catch (error) {
    console.error('Error deleting experience:', error);
    res.status(500).json({ error: 'Failed to delete experience' });
  }
};

export const addService = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const service = req.body;

    const result = await sql`
      INSERT INTO doctor_services (doctor_id, service_icon, service_name, service_description)
      VALUES (${doctorId}, ${service.service_icon}, ${service.service_name}, ${service.service_description})
      RETURNING id
    `;

    clearCachePattern(doctorId);
    res.json({ success: true, data: { id: result[0].id } });
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ error: 'Failed to add service' });
  }
};

export const updateService = async (req, res) => {
  try {
    const { doctorId, serviceId } = req.params;
    const service = req.body;

    await sql`
      UPDATE doctor_services 
      SET service_icon = ${service.service_icon}, 
          service_name = ${service.service_name},
          service_description = ${service.service_description}
      WHERE id = ${serviceId} AND doctor_id = ${doctorId}
    `;

    clearCachePattern(doctorId);
    res.json({ success: true, message: 'Service updated successfully' });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { doctorId, serviceId } = req.params;

    await sql`DELETE FROM doctor_services WHERE id = ${serviceId} AND doctor_id = ${doctorId}`;

    clearCachePattern(doctorId);
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
};

export const addChamber = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const chamber = req.body;

    const result = await sql`
      INSERT INTO doctor_chambers (doctor_id, chamber_location, available_time)
      VALUES (${doctorId}, ${chamber.chamber_location}, ${chamber.available_time})
      RETURNING id
    `;

    clearCachePattern(doctorId);
    res.json({ success: true, data: { id: result[0].id } });
  } catch (error) {
    console.error('Error adding chamber:', error);
    res.status(500).json({ error: 'Failed to add chamber' });
  }
};

export const updateChamber = async (req, res) => {
  try {
    const { doctorId, chamberId } = req.params;
    const chamber = req.body;

    await sql`
      UPDATE doctor_chambers 
      SET chamber_location = ${chamber.chamber_location}, 
          available_time = ${chamber.available_time}
      WHERE id = ${chamberId} AND doctor_id = ${doctorId}
    `;

    clearCachePattern(doctorId);
    res.json({ success: true, message: 'Chamber updated successfully' });
  } catch (error) {
    console.error('Error updating chamber:', error);
    res.status(500).json({ error: 'Failed to update chamber' });
  }
};

export const deleteChamber = async (req, res) => {
  try {
    const { doctorId, chamberId } = req.params;

    await sql`DELETE FROM doctor_chambers WHERE id = ${chamberId} AND doctor_id = ${doctorId}`;

    clearCachePattern(doctorId);
    res.json({ success: true, message: 'Chamber deleted successfully' });
  } catch (error) {
    console.error('Error deleting chamber:', error);
    res.status(500).json({ error: 'Failed to delete chamber' });
  }
};

export const addTestimonial = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const testimonial = req.body;

    const result = await sql`
      INSERT INTO doctor_testimonials (doctor_id, patient_name, patient_feedback, feedback_date)
      VALUES (${doctorId}, ${testimonial.patient_name}, ${testimonial.patient_feedback}, ${testimonial.feedback_date || null})
      RETURNING id
    `;

    clearCachePattern(doctorId);
    res.json({ success: true, data: { id: result[0].id } });
  } catch (error) {
    console.error('Error adding testimonial:', error);
    res.status(500).json({ error: 'Failed to add testimonial' });
  }
};

export const updateTestimonial = async (req, res) => {
  try {
    const { doctorId, testimonialId } = req.params;
    const testimonial = req.body;

    await sql`
      UPDATE doctor_testimonials 
      SET patient_name = ${testimonial.patient_name}, 
          patient_feedback = ${testimonial.patient_feedback},
          feedback_date = ${testimonial.feedback_date || null}
      WHERE id = ${testimonialId} AND doctor_id = ${doctorId}
    `;

    clearCachePattern(doctorId);
    res.json({ success: true, message: 'Testimonial updated successfully' });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
};

export const deleteTestimonial = async (req, res) => {
  try {
    const { doctorId, testimonialId } = req.params;

    await sql`DELETE FROM doctor_testimonials WHERE id = ${testimonialId} AND doctor_id = ${doctorId}`;

    clearCachePattern(doctorId);
    res.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
};

export const updateSocialMedia = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const socialMedia = req.body;

    // Delete existing and insert new
    await sql`DELETE FROM doctor_social_media WHERE doctor_id = ${doctorId}`;

    if (Array.isArray(socialMedia)) {
      for (const social of socialMedia) {
        if (social.platform && social.profile_url) {
          await sql`
            INSERT INTO doctor_social_media (doctor_id, platform, profile_url)
            VALUES (${doctorId}, ${social.platform}, ${social.profile_url})
          `;
        }
      }
    }

    clearCachePattern(doctorId);
    res.json({ success: true, message: 'Social media updated successfully' });
  } catch (error) {
    console.error('Error updating social media:', error);
    res.status(500).json({ error: 'Failed to update social media' });
  }
};

// Contact CRUD operations
export const updateContact = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const contactData = req.body;

    console.log('Updating contact for doctor:', doctorId, contactData);

    // Use UPSERT (INSERT ... ON CONFLICT ... DO UPDATE)
    const result = await sql`
      INSERT INTO doctor_contact (
        doctor_id, phone, whatsapp, email, address, emergency_contact_name,
        emergency_contact_phone, office_phone, fax, website_url, updated_at
      ) VALUES (
        ${doctorId}, ${contactData.phone || ''}, ${contactData.whatsapp || ''}, 
        ${contactData.email || ''}, ${contactData.address || ''}, 
        ${contactData.emergency_contact_name || ''}, ${contactData.emergency_contact_phone || ''},
        ${contactData.office_phone || ''}, ${contactData.fax || ''}, 
        ${contactData.website_url || ''}, CURRENT_TIMESTAMP
      )
      ON CONFLICT (doctor_id) DO UPDATE SET
        phone = ${contactData.phone || ''},
        whatsapp = ${contactData.whatsapp || ''},
        email = ${contactData.email || ''},
        address = ${contactData.address || ''},
        emergency_contact_name = ${contactData.emergency_contact_name || ''},
        emergency_contact_phone = ${contactData.emergency_contact_phone || ''},
        office_phone = ${contactData.office_phone || ''},
        fax = ${contactData.fax || ''},
        website_url = ${contactData.website_url || ''},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    clearCachePattern(doctorId);
    res.json({
      success: true,
      message: 'Contact information updated successfully',
      contact: result[0]
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact information' });
  }
};

export const getContact = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const result = await sql`
      SELECT * FROM doctor_contact 
      WHERE doctor_id = ${doctorId}
    `;

    if (result.length === 0) {
      // Return empty contact structure if none exists
      return res.json({
        success: true,
        contact: {
          phone: '',
          whatsapp: '',
          email: '',
          address: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          office_phone: '',
          fax: '',
          website_url: ''
        }
      });
    }

    res.json({ success: true, contact: result[0] });
  } catch (error) {
    console.error('Error getting contact:', error);
    res.status(500).json({ error: 'Failed to get contact information' });
  }
};

// Get a single blog post for public viewing
export const getPublicBlogPost = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await sql`
      SELECT 
        bp.*,
        d.first_name || ' ' || d.last_name as doctor_name,
        d.specialization as doctor_specialization,
        d.profile_image_url as doctor_image
      FROM blog_posts bp
      JOIN doctors d ON bp.doctor_id = d.id
      JOIN website_settings ws ON d.id = ws.doctor_id
      WHERE bp.slug = ${slug} 
      AND bp.status = 'published'
      AND ws.visibility = true
    `;

    if (blog.length === 0) {
      return res.status(404).json({ error: 'Blog post not found or not visible' });
    }

    // Increment view count asynchronously
    sql`UPDATE blog_posts SET views = views + 1 WHERE id = ${blog[0].id}`.catch(console.error);

    res.json({ success: true, data: blog[0] });
  } catch (error) {
    console.error('Error fetching public blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
};
