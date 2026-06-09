export function maskName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length <= 1) {
    return trimmed || '访客';
  }
  if (trimmed.length === 2) {
    return `${trimmed[0]}*${trimmed[1]}`;
  }
  return `${trimmed[0]}${'*'.repeat(trimmed.length - 2)}${trimmed[trimmed.length - 1]}`;
}

export function maskIdCard(idCard: string) {
  if (idCard.length <= 7) {
    return idCard;
  }
  return `${idCard.slice(0, 3)}${'*'.repeat(Math.max(0, idCard.length - 7))}${idCard.slice(-4)}`;
}

export function firstNameCharacter(name: string) {
  return name.trim()[0] || '访';
}
