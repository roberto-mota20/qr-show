// --- UTILITÁRIOS PIX (Lógica Pura) ---

// Formata campos TLV (Type-Length-Value)
export const formatPixField = (id, value) => {
  const val = value.toString();
  const len = val.length.toString().padStart(2, '0');
  return `${id}${len}${val}`;
};

// Calcula CRC16 (CCITT-FALSE)
export const calculateCRC16 = (payload) => {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};

// Gera o Payload Copia e Cola
export const generatePixCopyPaste = ({ pixKey, name, city, amount, txid }) => {
  const key = pixKey.trim();
  const safeName = name.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25);
  const safeCity = city.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 15);
  const safeTxid = txid.trim() || '***'; 
  
  let amountField = '';
  if (amount) {
    const formattedAmount = parseFloat(amount.replace(',', '.')).toFixed(2);
    amountField = formatPixField('54', formattedAmount);
  }

  let payload = [
    formatPixField('00', '01'), 
    formatPixField('26', 
      formatPixField('00', 'BR.GOV.BCB.PIX') + 
      formatPixField('01', key) 
    ),
    formatPixField('52', '0000'), 
    formatPixField('53', '986'), 
    amountField, 
    formatPixField('58', 'BR'), 
    formatPixField('59', safeName), 
    formatPixField('60', safeCity), 
    formatPixField('62', 
      formatPixField('05', safeTxid) 
    )
  ].join('');

  payload += '6304';
  payload += calculateCRC16(payload);

  return payload;
};

// Parser EMV Robusto (Leitura Sequencial)
const parseEmv = (str) => {
  let i = 0;
  const result = {};
  while (i < str.length) {
    if (i + 4 > str.length) break; 
    const id = str.substring(i, i + 2);
    const lenStr = str.substring(i + 2, i + 4);
    
    if (!/^\d+$/.test(lenStr)) break;
    
    const len = parseInt(lenStr, 10);
    if (i + 4 + len > str.length) break; 
    
    const val = str.substring(i + 4, i + 4 + len);
    result[id] = val;
    i += 4 + len;
  }
  return result;
};

// Importa dados de uma string Pix
export const parseImportedPix = (raw) => {
  try {
    const root = parseEmv(raw);
    const data = { pixKey: '', name: '', city: '', amount: '', txid: '' };

    data.name = root['59'] || '';
    data.city = root['60'] || '';
    data.amount = root['54'] || '';

    if (root['26']) {
      const merchantAccount = parseEmv(root['26']);
      data.pixKey = merchantAccount['01'] || '';
    }

    if (root['62']) {
      const additionalData = parseEmv(root['62']);
      data.txid = additionalData['05'] || '';
    }

    return data;
  } catch (e) {
    console.error("Erro no parser:", e);
    return null;
  }
};