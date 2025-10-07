import dayjs from "dayjs";

export default function formatDate(dateString) {
  if (!dateString) return "N/A";
  const d = dayjs(dateString);
  if (!d.isValid()) return "N/A";
  return d.format("DD/MM/YYYY");
}
