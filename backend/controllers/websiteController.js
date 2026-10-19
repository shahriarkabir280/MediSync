import { supabase, sql } from '../config/db.js';
import { saveBase64Image, deleteOldImage, isBase64Image } from '../utils/imageUtils.js';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
const migrationPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Auto-migration: ensure all required columns exist
export const runWebsiteMigration = async (req, res) => {
  const migrations = [
    `ALTER TABLE doctor_services ADD COLUMN IF NOT EXISTS features TEXT`,
    `ALTER TABLE doctor_services ADD COLUMN IF NOT EXISTS color_theme VARCHAR(100) DEFAULT 'from-blue-500 to-cyan-500'`,
    `ALTER TABLE doctor_chambers ADD COLUMN IF NOT EXISTS day VARCHAR(50)`,
    `ALTER TABLE doctor_testimonials ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5`,
    `ALTER TABLE doctor_testimonials ADD COLUMN IF NOT EXISTS location VARCHAR(255)`,
    `ALTER TABLE doctor_testimonials ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)`,
    `ALTER TABLE doctor_education ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'certification'`,
    `ALTER TABLE doctor_experience ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'current'`,
  ];
  const results = [];
  for (const query of migrations) {
    try {
      await migrationPool.query(query);
      results.push({ query: query.substring(0, 60) + '...', status: 'ok' });
    } catch (e) {
      results.push({ query: query.substring(0, 60) + '...', status: 'skipped: ' + e.message.substring(0, 40) });
    }
  }
  const summary = results.filter(r => r.status === 'ok').length + '/' + results.length + ' columns added';
  console.log('✅ Website column migration:', summary);
  if (res) res.json({ success: true, summary, results });
};

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

    // Fetch doctor and settings
    const { data: doctor, error: docError } = await supabase
      .from('doctors')
      .select(`
            *,
            website_settings (*)
        `)
      .eq('id', doctorId)
      .single();

    if (docError || !doctor) return res.status(404).json({ error: 'Doctor profile not found' });

    // Handle flattening of website settings
    const ws = doctor.website_settings?.[0] || {};
    const basicProfile = {
      ...doctor,
      title: ws.title,
      tagline: ws.tagline,
      description: ws.description,
      theme_color: ws.theme_color,
      layout_style: ws.layout_style,
      show_phone: ws.show_phone,
      show_email: ws.show_email,
      show_address: ws.show_address,
      show_appointment: ws.show_appointment,
      show_social: ws.show_social,
      meta_keywords: ws.meta_keywords,
      url_slug: ws.url_slug,
      visibility: ws.visibility,
      hero: ws.hero,
      about: ws.about,
      stats: ws.stats
    };

    // Parallel fetch of related data
    const [
      { data: education },
      { data: experience },
      { data: services },
      { data: chambers },
      { data: socialMedia },
      { data: testimonials },
      { data: sponsors }
    ] = await Promise.all([
      supabase.from('doctor_education').select('*').eq('doctor_id', doctorId).order('passing_year', { ascending: false }),
      supabase.from('doctor_experience').select('*').eq('doctor_id', doctorId).order('start_date', { ascending: false }),
      supabase.from('doctor_services').select('*').eq('doctor_id', doctorId).order('id'),
      supabase.from('doctor_chambers').select('*').eq('doctor_id', doctorId).order('id'),
      supabase.from('doctor_social_media').select('*').eq('doctor_id', doctorId).order('platform'),
      supabase.from('doctor_testimonials').select('*').eq('doctor_id', doctorId).order('feedback_date', { ascending: false }),
      supabase.from('doctor_sponsors').select('*').eq('doctor_id', doctorId).order('created_at', { ascending: false }) // Assuming created_at or other sort
    ]);

    const result = {
      ...basicProfile,
      education: education || [],
      experience: experience || [],
      services: services || [],
      chambers: chambers || [],
      social_media: socialMedia || [],
      testimonials: testimonials || [],
      affiliates: sponsors || []
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
      try {
        // Get current image URL to delete old file
        const { data: currentDoctor } = await supabase.from('doctors').select('profile_image_url').eq('id', doctorId).single();
        if (currentDoctor && currentDoctor.profile_image_url) {
          console.log('🗑️  Deleting old image:', currentDoctor.profile_image_url);
          deleteOldImage(currentDoctor.profile_image_url);
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
    await supabase.from('doctors').update({
      first_name: profileData.full_name?.split(' ')[0] || '',
      last_name: profileData.full_name?.split(' ').slice(1).join(' ') || '',
      profile_image_url: profileImageUrl || null,
      years_of_experience: profileData.years_experience || 0,
      updated_at: new Date().toISOString()
    }).eq('id', doctorId);

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
        visibility: profileData.website.visibility !== undefined ? profileData.website.visibility : true,
        hero: profileData.hero || {},
        about: profileData.about || {},
        stats: profileData.stats || {}
      };

      // Upsert website settings
      const { data: existingWeb } = await supabase.from('website_settings').select('id').eq('doctor_id', doctorId).maybeSingle();

      if (existingWeb) {
        await supabase.from('website_settings').update(websiteData).eq('doctor_id', doctorId);
      } else {
        await supabase.from('website_settings').insert({ ...websiteData, doctor_id: doctorId });
      }
    }

    // Helper for batch updates (Delete then Insert)
    const updateRelation = async (table, items, mapFn) => {
      if (!items || !Array.isArray(items)) return;
      await supabase.from(table).delete().eq('doctor_id', doctorId);
      const toInsert = items.map(mapFn).filter(Boolean); // mapFn returns null for invalid items
      if (toInsert.length > 0) {
        await supabase.from(table).insert(toInsert);
      }
    };

    // Update Education
    await updateRelation('doctor_education', profileData.education, (edu) => {
      if (!edu.degree || !edu.institution) return null;
      return {
        doctor_id: doctorId,
        degree: edu.degree,
        institution: edu.institution,
        passing_year: edu.passing_year,
        short_description: edu.short_description,
        type: edu.type || 'certification'
      };
    });

    // Update Experience
    await updateRelation('doctor_experience', profileData.experience, (exp) => {
      if (!exp.designation || !exp.organization) return null;
      return {
        doctor_id: doctorId,
        designation: exp.designation,
        organization: exp.organization,
        start_date: (exp.start_date && exp.start_date.trim()) ? exp.start_date : null,
        end_date: (exp.end_date && exp.end_date.trim()) ? exp.end_date : null,
        short_description: exp.short_description,
        type: exp.type || 'current'
      };
    });

    // Update Services
    await updateRelation('doctor_services', profileData.services, (service) => {
      if (!service.service_name) return null;
      return {
        doctor_id: doctorId,
        service_icon: service.service_icon,
        service_name: service.service_name,
        service_description: service.service_description,
        features: service.features,
        color_theme: service.color_theme || 'from-blue-500 to-cyan-500'
      };
    });

    // Update Chambers
    await updateRelation('doctor_chambers', profileData.chamber, (chamber) => {
      if (!chamber.chamber_location) return null;
      return {
        doctor_id: doctorId,
        chamber_location: chamber.chamber_location,
        available_time: chamber.time_range || chamber.available_time,
        day: chamber.day
      };
    });

    // Update Social Media
    await updateRelation('doctor_social_media', profileData.social_media, (social) => {
      if (!social.platform || !social.profile_url) return null;
      return {
        doctor_id: doctorId,
        platform: social.platform,
        profile_url: social.profile_url
      };
    });

    // Update Testimonials
    await updateRelation('doctor_testimonials', profileData.testimonials, (t) => {
      if (!t.name) return null;
      return {
        doctor_id: doctorId,
        patient_name: t.name,
        patient_feedback: t.message,
        rating: t.rating || 5,
        location: t.location,
        avatar_url: t.avatar
      };
    });

    // Update Sponsors/Affiliates
    await updateRelation('doctor_sponsors', profileData.affiliates, (aff) => {
      if (!aff.name) return null;
      return {
        doctor_id: doctorId,
        organization_name: aff.name,
        organization_logo: aff.logo
      };
    });

    // Update Contact (upsert)
    if (profileData.contact) {
      const contactData = profileData.contact;
      const dataToUpsert = {
        doctor_id: doctorId,
        phone: contactData.phone || '',
        whatsapp: contactData.whatsapp || '',
        email: contactData.email || '',
        address: contactData.address || '',
        emergency_contact_name: contactData.emergency_contact_name || '',
        emergency_contact_phone: contactData.emergency_contact_phone || '',
        office_phone: contactData.office_phone || '',
        fax: contactData.fax || '',
        website_url: contactData.website_url || '',
        updated_at: new Date().toISOString()
      };
      await supabase.from('doctor_contact').upsert(dataToUpsert, { onConflict: 'doctor_id' });
    }

    // Clear cache for this doctor (both ID-based and slug-based)
    const { data: ws } = await supabase.from('website_settings').select('url_slug').eq('doctor_id', doctorId).maybeSingle();
    if (ws?.url_slug) clearCachePattern(ws.url_slug);
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

    // Fetch doctor info via website settings (reverse lookup via slug)
    // We start with website_settings to match the slug
    const { data: ws, error: wsError } = await supabase
      .from('website_settings')
      .select(`
            *,
            doctor:doctors (*)
        `)
      .eq('url_slug', urlSlug)
      .eq('visibility', true)
      .single();

    if (wsError || !ws || !ws.doctor) {
      return res.status(404).json({ error: 'Public profile not found or not visible' });
    }

    const doctor = ws.doctor;
    const doctorId = doctor.id;

    // Fetch related tables
    const [
      { data: education },
      { data: experience },
      { data: services },
      { data: chambers },
      { data: socialMedia },
      { data: contact },
      { data: testimonials },
      { data: sponsors },
      { data: blogs }
    ] = await Promise.all([
      supabase.from('doctor_education').select('*').eq('doctor_id', doctorId).order('passing_year', { ascending: false }),
      supabase.from('doctor_experience').select('*').eq('doctor_id', doctorId).order('start_date', { ascending: false }),
      supabase.from('doctor_services').select('*').eq('doctor_id', doctorId),
      supabase.from('doctor_chambers').select('*').eq('doctor_id', doctorId),
      supabase.from('doctor_social_media').select('*').eq('doctor_id', doctorId),
      supabase.from('doctor_contact').select('*').eq('doctor_id', doctorId).single(),
      supabase.from('doctor_testimonials').select('*').eq('doctor_id', doctorId).order('feedback_date', { ascending: false }),
      supabase.from('doctor_sponsors').select('*').eq('doctor_id', doctorId),
      supabase.from('blog_posts').select('*').eq('doctor_id', doctorId).eq('status', 'published').order('published_at', { ascending: false }).limit(6)
    ]);

    // Format Data to match SQL output
    const formattedProfile = {
      id: doctor.id,
      full_name: `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim(),
      profile_photo_url: doctor.profile_image_url,
      specialization: doctor.specialization,
      years_experience: doctor.years_of_experience,
      email: doctor.email,
      phone: doctor.phone,
      ...ws, // Spread website settings (title, tagline, etc.)

      education: (education || []).map(e => ({
        degree: e.degree,
        institution: e.institution,
        passing_year: e.passing_year,
        short_description: e.short_description
      })),

      experience: (experience || []).map(e => ({
        designation: e.designation,
        organization: e.organization,
        start_date: e.start_date,
        end_date: e.end_date,
        short_description: e.short_description
      })),

      services: (services || []).map(s => ({
        service_icon: s.service_icon,
        service_name: s.service_name,
        service_description: s.service_description,
        features: s.features,
        color_theme: s.color_theme
      })),

      chambers: (chambers || []).map(c => ({
        chamber_location: c.chamber_location,
        available_time: c.available_time,
        day: c.day
      })),

      social_media: (socialMedia || []).map(s => ({
        platform: s.platform,
        profile_url: s.profile_url
      })),

      contact: contact ? {
        phone: contact.phone,
        whatsapp: contact.whatsapp,
        email: contact.email,
        address: contact.address,
        emergency_contact_name: contact.emergency_contact_name,
        emergency_contact_phone: contact.emergency_contact_phone,
        office_phone: contact.office_phone,
        fax: contact.fax,
        website_url: contact.website_url
      } : null,

      testimonials: (testimonials || []).map(t => ({
        name: t.patient_name,
        message: t.patient_feedback,
        date: t.feedback_date,
        rating: t.rating,
        location: t.location,
        avatar: t.avatar_url
      })),

      affiliates: (sponsors || []).map(s => ({
        name: s.organization_name,
        logo: s.organization_logo
      })),

      blogs: (blogs || []).map(b => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        excerpt: b.excerpt,
        featured_image: b.featured_image,
        category: b.category,
        published_at: b.published_at,
        read_time: b.read_time,
        views: b.views
      }))
    };

    // Cache the result for longer (public profiles don't change often)
    setCache(cacheKey, formattedProfile);

    res.json({ success: true, data: formattedProfile });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ error: 'Failed to fetch public profile' });
  }
};

// Upload profile image (placeholder - implement with actual file upload service)
export const uploadProfileImage = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const imageUrl = `https://example.com/profiles/${doctorId}/profile.jpg`;

    await supabase
      .from('doctors')
      .update({ profile_image_url: imageUrl, updated_at: new Date().toISOString() })
      .eq('id', doctorId);

    // Clear cache for this doctor (both ID-based and slug-based)
    const { data: ws } = await supabase.from('website_settings').select('url_slug').eq('doctor_id', doctorId).maybeSingle();
    if (ws?.url_slug) clearCachePattern(ws.url_slug);
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

    const { data: settings, error } = await supabase
      .from('website_settings')
      .select('*')
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (error) throw error;

    res.json({ success: true, data: settings || {} });
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
    const { data: existing } = await supabase.from('website_settings').select('id').eq('doctor_id', doctorId).maybeSingle();

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
      visibility: settings.visibility !== undefined ? settings.visibility : true,
      doctor_id: doctorId
    };

    if (existing) {
      await supabase.from('website_settings').update(websiteData).eq('doctor_id', doctorId);
    } else {
      await supabase.from('website_settings').insert(websiteData);
    }

    // Clear cache for this doctor (both ID-based and slug-based)
    if (websiteData.url_slug) clearCachePattern(websiteData.url_slug);
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

    const { count: educationCount } = await supabase.from('doctor_education').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
    const { count: experienceCount } = await supabase.from('doctor_experience').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
    const { count: servicesCount } = await supabase.from('doctor_services').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
    const { count: chambersCount } = await supabase.from('doctor_chambers').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
    const { count: testimonialsCount } = await supabase.from('doctor_testimonials').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
    const { data: website } = await supabase.from('website_settings').select('visibility').eq('doctor_id', doctorId).single();

    const stats = {
      education_count: educationCount || 0,
      experience_count: experienceCount || 0,
      services_count: servicesCount || 0,
      chambers_count: chambersCount || 0,
      testimonials_count: testimonialsCount || 0,
      website_visible: website?.visibility || false
    };

    setCache(cacheKey, stats);

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// Individual CRUD operations
const createCrudHandler = (table, fields) => ({
  add: async (req, res) => {
    try {
      const { doctorId } = req.params;
      const body = req.body;
      const data = { doctor_id: doctorId };
      fields.forEach(f => {
        if (body[f] !== undefined) data[f] = body[f] === '' ? null : body[f];
      });

      const { data: newRecord, error } = await supabase.from(table).insert(data).select('id').single();
      if (error) throw error;

      clearCachePattern(doctorId);
      res.json({ success: true, data: { id: newRecord.id } });
    } catch (error) {
      console.error(`Error adding to ${table}:`, error);
      res.status(500).json({ error: `Failed to add to ${table}` });
    }
  },
  update: async (req, res) => {
    try {
      const { doctorId } = req.params;
      const id = req.params.educationId || req.params.experienceId || req.params.serviceId || req.params.chamberId || req.params.testimonialId;
      const body = req.body;
      const data = {};
      fields.forEach(f => {
        if (body[f] !== undefined) data[f] = body[f] === '' ? null : body[f];
      });

      const { error } = await supabase.from(table).update(data).eq('id', id).eq('doctor_id', doctorId);
      if (error) throw error;

      clearCachePattern(doctorId);
      res.json({ success: true, message: 'Updated successfully' });
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      res.status(500).json({ error: `Failed to update ${table}` });
    }
  },
  delete: async (req, res) => {
    try {
      const { doctorId } = req.params;
      const id = req.params.educationId || req.params.experienceId || req.params.serviceId || req.params.chamberId || req.params.testimonialId;

      const { error } = await supabase.from(table).delete().eq('id', id).eq('doctor_id', doctorId);
      if (error) throw error;

      clearCachePattern(doctorId);
      res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      res.status(500).json({ error: `Failed to delete from ${table}` });
    }
  }
});

// Education
const eduHandler = createCrudHandler('doctor_education', ['degree', 'institution', 'passing_year', 'short_description']);
export const addEducation = eduHandler.add;
export const updateEducation = eduHandler.update;
export const deleteEducation = eduHandler.delete;

// Experience
const expHandler = createCrudHandler('doctor_experience', ['designation', 'organization', 'start_date', 'end_date', 'short_description']);
export const addExperience = expHandler.add;
export const updateExperience = expHandler.update;
export const deleteExperience = expHandler.delete;

// Services
const srvHandler = createCrudHandler('doctor_services', ['service_icon', 'service_name', 'service_description', 'features', 'color_theme']);
export const addService = srvHandler.add;
export const updateService = srvHandler.update;
export const deleteService = srvHandler.delete;

// Chambers
const chmHandler = createCrudHandler('doctor_chambers', ['chamber_location', 'available_time', 'day']);
export const addChamber = chmHandler.add;
export const updateChamber = chmHandler.update;
export const deleteChamber = chmHandler.delete;

// Testimonials
const tstHandler = createCrudHandler('doctor_testimonials', ['patient_name', 'patient_feedback', 'feedback_date', 'rating', 'location', 'avatar_url']);
export const addTestimonial = tstHandler.add;
export const updateTestimonial = tstHandler.update;
export const deleteTestimonial = tstHandler.delete;

// Social Media
export const updateSocialMedia = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const socialMedia = req.body;

    // Delete existing and insert new
    await supabase.from('doctor_social_media').delete().eq('doctor_id', doctorId);

    if (Array.isArray(socialMedia)) {
      const toInsert = socialMedia.map(s => {
        if (!s.platform || !s.profile_url) return null;
        return { doctor_id: doctorId, platform: s.platform, profile_url: s.profile_url };
      }).filter(Boolean);

      if (toInsert.length > 0) {
        await supabase.from('doctor_social_media').insert(toInsert);
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

    const dataToUpsert = {
      doctor_id: doctorId,
      phone: contactData.phone || '',
      whatsapp: contactData.whatsapp || '',
      email: contactData.email || '',
      address: contactData.address || '',
      emergency_contact_name: contactData.emergency_contact_name || '',
      emergency_contact_phone: contactData.emergency_contact_phone || '',
      office_phone: contactData.office_phone || '',
      fax: contactData.fax || '',
      website_url: contactData.website_url || '',
      updated_at: new Date().toISOString()
    };

    const { data: result, error } = await supabase
      .from('doctor_contact')
      .upsert(dataToUpsert, { onConflict: 'doctor_id' })
      .select()
      .single();

    if (error) throw error;

    clearCachePattern(doctorId);
    res.json({
      success: true,
      message: 'Contact information updated successfully',
      contact: result
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact information' });
  }
};

export const getContact = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const { data: result } = await supabase
      .from('doctor_contact')
      .select('*')
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (!result) {
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

    res.json({ success: true, contact: result });
  } catch (error) {
    console.error('Error getting contact:', error);
    res.status(500).json({ error: 'Failed to get contact information' });
  }
};

// Get a single blog post for public viewing
export const getPublicBlogPost = async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: blog, error } = await supabase
      .from('blog_posts')
      .select(`
            *,
            doctor:doctors (first_name, last_name, specialization, profile_image_url)
        `)
      .eq('slug', slug)
      .eq('status', 'published')
      // website_settings relates to doctors, not blog_posts, so visibility is checked below
      .single();

    if (error || !blog) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Check visibility separately to be safe and simple
    const { data: ws } = await supabase.from('website_settings').select('visibility').eq('doctor_id', blog.doctor_id).single();
    if (!ws || !ws.visibility) {
      return res.status(404).json({ error: 'Blog post not found or not visible' });
    }

    // Format
    const formatBlog = {
      ...blog,
      doctor_name: `${blog.doctor?.first_name} ${blog.doctor?.last_name}`,
      doctor_specialization: blog.doctor?.specialization,
      doctor_image: blog.doctor?.profile_image_url
    };

    // View count increment (read-then-write; a lost update under concurrency is acceptable for views)
    const { error: viewError } = await supabase
      .from('blog_posts')
      .update({ views: (blog.views || 0) + 1 })
      .eq('id', blog.id);
    if (viewError) console.error('Error incrementing blog views:', viewError);

    res.json({ success: true, data: formatBlog });
  } catch (error) {
    console.error('Error fetching public blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
};
