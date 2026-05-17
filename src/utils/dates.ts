import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ro';

dayjs.extend(relativeTime);
dayjs.locale('ro');

export function formatMessageTime(iso: string): string {
  const d = dayjs(iso);
  const now = dayjs();
  if (d.isSame(now, 'day')) {
    return d.format('HH:mm');
  }
  if (d.isSame(now.subtract(1, 'day'), 'day')) {
    return `Ieri ${d.format('HH:mm')}`;
  }
  return d.format('D MMM, HH:mm');
}

export function formatRelative(iso: string): string {
  return dayjs(iso).fromNow();
}
