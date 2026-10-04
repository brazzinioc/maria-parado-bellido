// Enlaces wa.me con mensaje prellenado. Sin número explícito usa el de contacto
// general del sitio (PUBLIC_WHATSAPP_NUMBER).
const DEFAULT_NUMBER = import.meta.env.PUBLIC_WHATSAPP_NUMBER || '+51999888777';

export function whatsappUrl(message: string, phone: string = DEFAULT_NUMBER): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

// Un teléfono sirve para WhatsApp si tiene al menos 9 dígitos (celular peruano)
// y no es un marcador como "+51 9XX XXX XXX".
export function isDialable(phone?: string): phone is string {
  return Boolean(phone && !/x/i.test(phone) && phone.replace(/\D/g, '').length >= 9);
}
