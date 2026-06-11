-- Hibernate 6 + PostgreSQL dialect trata CHAR(3)/bpchar como Types#CHAR
-- pero valida contra Types#VARCHAR. Convertir a VARCHAR(3) para alinear.

ALTER TABLE products  ALTER COLUMN currency TYPE VARCHAR(3);
ALTER TABLE orders    ALTER COLUMN currency TYPE VARCHAR(3);
ALTER TABLE payments  ALTER COLUMN currency TYPE VARCHAR(3);
ALTER TABLE quotations ALTER COLUMN currency TYPE VARCHAR(3);
