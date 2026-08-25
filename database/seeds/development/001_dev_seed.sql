-- JUSTSAY Isolated Development Seed Data (DO NOT RUN IN PRODUCTION)

INSERT INTO card_templates (name, gradient_start_hex, gradient_end_hex, text_color_hex, sticker, category) VALUES
('Neon Cyber', '#FF2A85', '#9B5DE5', '#FFFFFF', '🤫 Top Secret', 'Neon'),
('Sunset Glow', '#FF7B00', '#FF0266', '#FFFFFF', '💖 Crush Alert', 'Warm'),
('Acid Cyan', '#00F5D4', '#7B2CBF', '#FFFFFF', '💅 Slay', 'Cyber'),
('Midnight Velvet', '#3A0CA3', '#10002B', '#FFFFFF', '👀 Spill The Tea', 'Dark'),
('Pastel Mint', '#70E400', '#38B000', '#10002B', '🔥 No Cap', 'Pastel');

INSERT INTO feature_flags (flag_key, is_enabled, rollout_percentage) VALUES
('card_studio_v2', true, 100),
('image_uploads', false, 0),
('gif_support', false, 0),
('anonymous_replies', true, 100),
('ai_moderation_v2', true, 100),
('story_export_v2', true, 100);
