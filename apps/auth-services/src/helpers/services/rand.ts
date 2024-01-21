export default function rand(times: number) {
  return Array.from({ length: times })
    .map(() => Math.random().toString(36).substring(2))
    .join('');
}
