-- Marina: paleta Coastal Premium refinada + contraste legible
UPDATE organizations
SET
  primary_color = '#050C12',
  secondary_color = '#0A1620',
  accent_color = '#3FE0D4',
  theme_mode = 'dark',
  font_family = 'Playfair Display'
WHERE slug = 'marina';
