export function EventDate({ date, locale }: { date: Date; locale: string }) {
  return (
    <time className="event-date" dateTime={date.toISOString().slice(0, 10)}>
      <strong>
        {new Intl.DateTimeFormat(locale, {
          day: "numeric",
          timeZone: "UTC",
        }).format(date)}
      </strong>
      <span>
        {new Intl.DateTimeFormat(locale, {
          month: "short",
          timeZone: "UTC",
        }).format(date)}
      </span>
      <small>{date.getUTCFullYear()}</small>
    </time>
  );
}
