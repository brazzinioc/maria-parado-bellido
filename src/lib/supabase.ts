import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // El sitio publico solo lee; no necesita persistir sesiones.
    persistSession: false,
    autoRefreshToken: false,
  },
});

// El bucket de imagenes del CMS es publico. Convierte el file_path guardado en
// t_media a una URL absoluta consumible desde el navegador / build.
export function mediaUrl(filePath?: string | null): string | undefined {
  if (!filePath) return undefined;
  return supabase.storage.from('images').getPublicUrl(filePath).data.publicUrl;
}
