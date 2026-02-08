-- Core Tables (from server.js)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
  id SERIAL PRIMARY KEY,
  unique_id VARCHAR(20) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  phone VARCHAR(20),
  specialization VARCHAR(100),
  license_number VARCHAR(50),
  years_of_experience INTEGER,
  bio TEXT,
  profile_image_url VARCHAR(500),
  two_factor_enabled BOOLEAN DEFAULT false,
  backup_codes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_settings (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  default_appointment_duration INTEGER DEFAULT 30,
  working_hours_start TIME DEFAULT '09:00',
  working_hours_end TIME DEFAULT '17:00',
  consultation_fee DECIMAL(10, 2) DEFAULT 0,
  accept_new_patients BOOLEAN DEFAULT true,
  notification_settings JSONB,
  billing_settings JSONB,
  payment_methods JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(doctor_id)
);

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  unique_id VARCHAR(20) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20),
  blood_group VARCHAR(5),
  address TEXT,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  medical_history TEXT,
  allergies TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  actual_start_time TIME,
  actual_end_time TIME,
  status VARCHAR(20) DEFAULT 'pending',
  appointment_type VARCHAR(50) DEFAULT 'consultation',
  notes TEXT,
  suggestions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medical_records (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  diagnosis TEXT,
  prescription TEXT,
  notes TEXT,
  lab_results TEXT,
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  file_type VARCHAR(50),
  file_size INTEGER,
  original_name VARCHAR(255),
  record_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  due_date DATE,
  payment_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'medium',
  actionable BOOLEAN DEFAULT false,
  action_url VARCHAR(500),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_delivery_logs (
  id SERIAL PRIMARY KEY,
  notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
  delivery_method VARCHAR(20) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  delivered_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(600) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image VARCHAR(500),
  category VARCHAR(100),
  tags JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP,
  views INTEGER DEFAULT 0,
  read_time INTEGER DEFAULT 0,
  meta_title VARCHAR(600),
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blog_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(120) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blog_comments (
  id SERIAL PRIMARY KEY,
  blog_post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emails (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  sender_email VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  recipient_id INTEGER,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  body TEXT,
  cc TEXT,
  bcc TEXT,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT false,
  folder VARCHAR(50) DEFAULT 'inbox',
  reply_to_id INTEGER REFERENCES emails(id) ON DELETE SET NULL,
  deleted_by_sender BOOLEAN DEFAULT false,
  deleted_by_recipient BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  type VARCHAR(100),
  color VARCHAR(50) DEFAULT 'blue',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_doctor_id ON billing(doctor_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing(status);
CREATE INDEX IF NOT EXISTS idx_notifications_doctor_id ON notifications(doctor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_notification_id ON notification_delivery_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_doctor_id ON blog_posts(doctor_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_emails_sender_id ON emails(sender_id);
CREATE INDEX IF NOT EXISTS idx_emails_recipient_id ON emails(recipient_id);
CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails(folder);
CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read);
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_doctor_id ON calendar_events(doctor_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);


-- Chat System Tables (from chatSchema.js)

CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'private',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP,
  is_archived BOOLEAN DEFAULT FALSE,
  CONSTRAINT chk_chat_type CHECK (type IN ('private', 'group'))
);

CREATE TABLE IF NOT EXISTS chat_participants (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL,
  user_type VARCHAR(20) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255),
  user_avatar VARCHAR(500),
  joined_at TIMESTAMP DEFAULT NOW(),
  last_read_at TIMESTAMP DEFAULT NOW(),
  is_muted BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  custom_nickname VARCHAR(255),
  UNIQUE(chat_id, user_id, user_type),
  CONSTRAINT chk_user_type CHECK (user_type IN ('doctor', 'patient', 'admin'))
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id VARCHAR(50) NOT NULL,
  sender_type VARCHAR(20) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  content TEXT,
  encrypted_content TEXT,
  message_type VARCHAR(20) DEFAULT 'text',
  media_url VARCHAR(500),
  media_name VARCHAR(255),
  media_size INTEGER,
  media_type VARCHAR(100),
  thumbnail_url VARCHAR(500),
  reply_to_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
  is_forwarded BOOLEAN DEFAULT FALSE,
  forward_from_chat_id INTEGER,
  forward_from_message_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  delete_for_everyone BOOLEAN DEFAULT FALSE,
  CONSTRAINT chk_message_type CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file', 'voice', 'document', 'location', 'call'))
);

CREATE TABLE IF NOT EXISTS message_status (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL,
  user_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'sent',
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  UNIQUE(message_id, user_id, user_type),
  CONSTRAINT chk_status CHECK (status IN ('sent', 'delivered', 'read'))
);

CREATE TABLE IF NOT EXISTS message_reactions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL,
  user_type VARCHAR(20) NOT NULL,
  reaction VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, user_type)
);

CREATE TABLE IF NOT EXISTS typing_indicators (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL,
  user_type VARCHAR(20) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  is_typing BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '10 seconds',
  UNIQUE(chat_id, user_id, user_type)
);

CREATE TABLE IF NOT EXISTS user_encryption_keys (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  user_type VARCHAR(20) NOT NULL,
  public_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, user_type)
);

CREATE TABLE IF NOT EXISTS chat_settings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  user_type VARCHAR(20) NOT NULL,
  
  -- Notification Settings
  sound_enabled BOOLEAN DEFAULT TRUE,
  desktop_notifications BOOLEAN DEFAULT TRUE,
  message_preview BOOLEAN DEFAULT TRUE,
  
  -- Privacy Settings
  read_receipts BOOLEAN DEFAULT TRUE,
  online_status BOOLEAN DEFAULT TRUE,
  typing_indicator BOOLEAN DEFAULT TRUE,
  last_seen BOOLEAN DEFAULT TRUE,
  
  -- Media Settings
  auto_download BOOLEAN DEFAULT TRUE,
  auto_play BOOLEAN DEFAULT FALSE,
  
  -- Chat Preferences
  enter_to_send BOOLEAN DEFAULT TRUE,
  font_size VARCHAR(20) DEFAULT 'medium',
  theme VARCHAR(20) DEFAULT 'light',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, user_type),
  CONSTRAINT chk_user_type_settings CHECK (user_type IN ('doctor', 'patient', 'admin')),
  CONSTRAINT chk_font_size CHECK (font_size IN ('small', 'medium', 'large')),
  CONSTRAINT chk_theme CHECK (theme IN ('light', 'dark', 'auto'))
);

CREATE INDEX IF NOT EXISTS idx_chats_updated ON chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_last_message ON chats(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat ON chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_status_message ON message_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_status_user ON message_status(user_id, user_type, status);
CREATE INDEX IF NOT EXISTS idx_typing_chat ON typing_indicators(chat_id, expires_at);

-- Functions and Triggers

CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats
  SET updated_at = NOW(), last_message_at = NOW()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_chat_timestamp ON messages;

CREATE TRIGGER tr_update_chat_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_timestamp();


-- Help System Tables
CREATE TABLE IF NOT EXISTS help_faq (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  question TEXT UNIQUE NOT NULL,
  answer TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS help_documentation (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  priority VARCHAR(50) DEFAULT 'medium',
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_ticket_responses (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
  responder_type VARCHAR(50) NOT NULL, -- 'doctor' or 'admin'
  responder_id INTEGER,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Website System Tables
CREATE TABLE IF NOT EXISTS website_settings (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER UNIQUE REFERENCES doctors(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'Dr. Profile',
  tagline TEXT,
  description TEXT,
  theme_color VARCHAR(7) DEFAULT '#2563eb',
  layout_style VARCHAR(50) DEFAULT 'modern',
  show_phone BOOLEAN DEFAULT true,
  show_email BOOLEAN DEFAULT true,
  show_address BOOLEAN DEFAULT true,
  show_appointment BOOLEAN DEFAULT true,
  show_social BOOLEAN DEFAULT true,
  meta_keywords TEXT,
  url_slug VARCHAR(255) UNIQUE,
  visibility BOOLEAN DEFAULT true,
  hero JSONB,
  about JSONB,
  stats JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_education (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  degree VARCHAR(255) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  passing_year INTEGER,
  short_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_experience (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  designation VARCHAR(255) NOT NULL,
  organization VARCHAR(255) NOT NULL,
  start_date DATE,
  end_date DATE,
  short_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_services (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  service_icon VARCHAR(100),
  service_name VARCHAR(255) NOT NULL,
  service_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_chambers (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  chamber_location TEXT NOT NULL,
  available_time VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_testimonials (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL,
  patient_feedback TEXT NOT NULL,
  feedback_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_sponsors (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  organization_logo VARCHAR(500),
  organization_name VARCHAR(255) NOT NULL,
  organization_description TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_social_media (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  profile_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(doctor_id, platform)
);

CREATE TABLE IF NOT EXISTS doctor_contact (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER UNIQUE REFERENCES doctors(id) ON DELETE CASCADE,
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  office_phone VARCHAR(20),
  fax VARCHAR(20),
  website_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab System Tables
CREATE TABLE IF NOT EXISTS lab_test_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_tests (
  id SERIAL PRIMARY KEY,
  test_code VARCHAR(50) UNIQUE NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  category_id INTEGER REFERENCES lab_test_categories(id) ON DELETE CASCADE,
  cost DECIMAL(10, 2) DEFAULT 0,
  description TEXT,
  sample_type VARCHAR(100),
  turnaround_time_hours INTEGER,
  normal_range_min VARCHAR(50),
  normal_range_max VARCHAR(50),
  unit VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal',
  clinical_notes TEXT,
  total_cost DECIMAL(10, 2) DEFAULT 0,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sample_collection_date TIMESTAMP,
  sample_collection_notes TEXT,
  report_date TIMESTAMP,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES lab_orders(id) ON DELETE CASCADE,
  test_id INTEGER REFERENCES lab_tests(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_results (
  id SERIAL PRIMARY KEY,
  order_item_id INTEGER UNIQUE REFERENCES lab_order_items(id) ON DELETE CASCADE,
  result_value VARCHAR(255),
  result_text TEXT,
  reference_range VARCHAR(255),
  unit VARCHAR(50),
  status VARCHAR(50) DEFAULT 'normal', -- normal, abnormal, critical
  abnormal_flag BOOLEAN DEFAULT false,
  critical_flag BOOLEAN DEFAULT false,
  result_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_by INTEGER,
  verified_at TIMESTAMP,
  notes TEXT,
  file_path VARCHAR(500),
  file_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_report_files (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES lab_orders(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback Table
CREATE TABLE IF NOT EXISTS patient_feedback (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Additional Indexes
CREATE INDEX IF NOT EXISTS idx_website_settings_doctor_id ON website_settings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_website_settings_url_slug ON website_settings(url_slug);
CREATE INDEX IF NOT EXISTS idx_doctor_education_doctor_id ON doctor_education(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_experience_doctor_id ON doctor_experience(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_services_doctor_id ON doctor_services(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_chambers_doctor_id ON doctor_chambers(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_testimonials_doctor_id ON doctor_testimonials(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_sponsors_doctor_id ON doctor_sponsors(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_social_media_doctor_id ON doctor_social_media(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_contact_doctor_id ON doctor_contact(doctor_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_doctor_id ON lab_orders(doctor_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_id ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_tests_category_id ON lab_tests(category_id);
CREATE INDEX IF NOT EXISTS idx_lab_order_items_order_id ON lab_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_order_item_id ON lab_results(order_item_id);
