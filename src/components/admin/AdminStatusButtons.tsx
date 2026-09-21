"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { InquiryStatus, ItemRequestStatus } from "@prisma/client";
import { changeInquiryStatusAction, changeWantedRequestStatusAction } from "@/server/actions/customer";
import { nextInquiryStatuses } from "@/lib/domain/inquiry-status";
import { nextRequestStatuses } from "@/lib/domain/request-status";

export function AdminStatusButtons({
  id,
  current,
  labels,
  kind,
}: {
  id: string;
  current: string;
  labels: Record<string, string>;
  kind: "inquiry" | "request";
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const options =
    kind === "inquiry"
      ? nextInquiryStatuses(current as InquiryStatus)
      : nextRequestStatuses(current as ItemRequestStatus);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((value) => (
          <button
            key={value}
            type="button"
            className="border border-ink/20 px-3 py-2 text-[0.68rem] uppercase tracking-wider"
            onClick={async () => {
              const result =
                kind === "inquiry"
                  ? await changeInquiryStatusAction(id, value)
                  : await changeWantedRequestStatusAction(id, value);
              setMessage(result.ok ? `Статус: ${labels[value]}` : result.message);
              if (result.ok) router.refresh();
            }}
          >
            {labels[value]}
          </button>
        ))}
      </div>
      {message ? <p className="text-sm text-walnut">{message}</p> : null}
    </div>
  );
}
