-- Corrige colores IKON: negro vivo en todo el sitio (no azul de defaults de plataforma)
UPDATE organizations
SET
  primary_color = '#0A0A0A',
  secondary_color = '#0A0A0A',
  accent_color = '#32E4B5',
  theme_mode = 'dark',
  font_family = 'Instrument Serif'
WHERE slug = 'ikon';
