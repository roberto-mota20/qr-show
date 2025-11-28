import React from 'react';

// Um parser simples para evitar dependências pesadas como 'react-markdown'
// Ele suporta: ## Títulos, ### Subtítulos, **negrito**, - listas e links [texto](url)
export default function SimpleMarkdown({ content }) {
  if (!content) return null;

  // Quebra o conteúdo em linhas para processar
  const lines = content.split('\n');
  const elements = [];
  
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="md-list">
          {listBuffer.map((item, i) => <li key={i}>{parseInline(item)}</li>)}
        </ul>
      );
      listBuffer = [];
    }
  };

  const parseInline = (text) => {
    // Processa **negrito** e `code`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="md-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="md-code">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    if (!trimmed) {
      flushList();
      return;
    }

    // Headers
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={index} className="md-h2">{trimmed.substring(3)}</h2>);
    } else if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={index} className="md-h3">{trimmed.substring(4)}</h3>);
    } 
    // Listas
    else if (trimmed.startsWith('- ')) {
      listBuffer.push(trimmed.substring(2));
    } 
    // Parágrafos normais
    else {
      flushList();
      elements.push(<p key={index} className="md-p">{parseInline(trimmed)}</p>);
    }
  });

  flushList(); // Garante que a última lista seja renderizada

  return <div className="markdown-container">{elements}</div>;
}