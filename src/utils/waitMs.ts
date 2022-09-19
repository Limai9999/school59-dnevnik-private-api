export default function waitMs(min: number, max: number, log: boolean = true, type?: string): Promise<void> {
  return new Promise((resolve) => {
    const waiting = Math.floor(Math.random() * (max - min + 1)) + min;

    if (log) console.log(`Ожидание ${waiting / 1000} секунд - ${type || 'неизвестно'}...`);

    setTimeout(resolve, waiting);
  });
}
