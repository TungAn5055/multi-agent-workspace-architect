export function formatRelativeDate(dateLike: string) {
  const formatter = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });

  return formatter.format(new Date(dateLike));
}

export function formatRunStatus(status: string | null | undefined) {
  switch (status) {
    case 'queued':
      return 'Đang xếp hàng';
    case 'running':
      return 'Đang chạy';
    case 'waiting_human':
      return 'Đang chờ bạn';
    case 'completed':
      return 'Hoàn tất';
    case 'failed':
      return 'Lỗi';
    case 'cancelled':
      return 'Đã dừng';
    default:
      return 'Chưa chạy';
  }
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
