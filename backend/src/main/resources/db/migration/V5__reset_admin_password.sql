-- Migración V5: Resetear password del admin a 'admin.123'
-- Hash BCrypt strength=10 generado para la contraseña: admin.123
-- Spring Security BCryptPasswordEncoder acepta prefijo $2b$
UPDATE users
SET password_hash = '$2b$10$cBhm0NvwLhN7U0wKSBHfkOczFEs5JTfHLEKdeXh8BCMY1NYuHbuNW'
WHERE email = 'admin@fashionhouse.com';
