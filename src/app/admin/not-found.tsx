import { AdminRecordNotFound } from "@/components/admin/AdminRecordNotFound";

export default function AdminNotFound() {
  return (
    <AdminRecordNotFound
      title="Не е пронајдено"
      message="Бараниот админ запис не постои или повеќе не е достапен."
    />
  );
}
