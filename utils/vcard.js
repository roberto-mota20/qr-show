// --- UTILITÁRIOS VCARD (Formato 3.0) ---

export const generateVCard = ({ firstName, lastName, phone, email, website, org, title, street, city, state, country }) => {
  // Limpeza básica
  const clean = (str) => (str || '').trim();

  // Monta o nome completo
  const fn = `${clean(firstName)} ${clean(lastName)}`.trim();
  
  // Monta o array de linhas do vCard
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${clean(lastName)};${clean(firstName)};;;`,
    `FN:${fn}`,
  ];

  if (org) lines.push(`ORG:${clean(org)}`);
  if (title) lines.push(`TITLE:${clean(title)}`);
  if (phone) lines.push(`TEL;TYPE=CELL:${clean(phone)}`);
  if (email) lines.push(`EMAIL:${clean(email)}`);
  if (website) lines.push(`URL:${clean(website)}`);
  
  // Endereço (formato: ;;Rua;Cidade;Estado;Cep;Pais)
  if (street || city || state || country) {
    lines.push(`ADR:;;${clean(street)};${clean(city)};${clean(state)};;${clean(country)}`);
  }

  lines.push('END:VCARD');

  return lines.join('\n');
};

// Parser simples para leitura (usado na visualização)
export const parseVCard = (content) => {
  const getField = (regex) => {
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  };

  return {
    firstName: getField(/FN:(.*)/), // Nome formatado
    phone: getField(/TEL.*:(.*)/),
    email: getField(/EMAIL:(.*)/),
    org: getField(/ORG:(.*)/),
    title: getField(/TITLE:(.*)/)
  };
};