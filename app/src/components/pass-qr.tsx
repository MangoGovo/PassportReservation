import { View } from 'react-native';

const size = 21;
const cells = Array.from({ length: size * size }, (_, index) => {
  const row = Math.floor(index / size);
  const col = index % size;
  return { row, col, filled: isFilled(row, col) };
});

export function PassQr({ color, disabled }: { color: string; disabled?: boolean }) {
  const moduleColor = disabled ? '#718096' : color;

  return (
    <View
      style={{
        width: 212,
        height: 212,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0px 4px 16px ${disabled ? 'rgba(113,128,150,0.22)' : 'rgba(128,90,213,0.25)'}`,
      }}
    >
      <View
        style={{
          width: 168,
          height: 168,
          flexDirection: 'row',
          flexWrap: 'wrap',
          opacity: disabled ? 0.55 : 1,
        }}
      >
        {cells.map((cell) => (
          <View
            key={`${cell.row}-${cell.col}`}
            style={{
              width: 8,
              height: 8,
              backgroundColor: cell.filled ? moduleColor : '#ffffff',
            }}
          />
        ))}
      </View>
    </View>
  );
}

function isFilled(row: number, col: number) {
  if (finder(row, col, 0, 0) || finder(row, col, 14, 0) || finder(row, col, 0, 14)) {
    return true;
  }
  if ((row + col) % 7 === 0) {
    return true;
  }
  if ((row * 3 + col * 5) % 11 === 0) {
    return true;
  }
  if (row > 8 && col > 8 && (row + col * 2) % 5 === 0) {
    return true;
  }
  return row === 10 || col === 10 ? (row + col) % 2 === 0 : false;
}

function finder(row: number, col: number, left: number, top: number) {
  const x = col - left;
  const y = row - top;
  if (x < 0 || y < 0 || x > 6 || y > 6) {
    return false;
  }
  return x === 0 || y === 0 || x === 6 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
}
