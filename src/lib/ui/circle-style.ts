const PALETTE = [
  "#C9A6A6",
  "#C19552",
  "#8FA68E",
  "#5A8A8A",
  "#7A9AB0",
  "#9A8AA6",
  "#B89AA6",
  "#C48A7A",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

export function getCircleAccent(slug: string) {
  const hex = PALETTE[Math.abs(hashString(slug)) % PALETTE.length];
  const { r, g, b } = hexToRgb(hex);

  return {
    hex,
    chipStyle: {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
      color: hex,
    } as React.CSSProperties,
    stripStyle: {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.25)`,
    } as React.CSSProperties,
    badgeStyle: {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.08)`,
      color: hex,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.25)`,
    } as React.CSSProperties,
  };
}
