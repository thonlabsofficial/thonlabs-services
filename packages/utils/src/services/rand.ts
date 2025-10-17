export default function rand(times: number) {
  return Array.from({ length: times })
    .map(() => {
      const str = Math.random().toString(36).substring(2);
      return str
        .split('')
        .map((char) => (Math.random() < 0.5 ? char.toUpperCase() : char))
        .join('');
    })
    .join('');
}
