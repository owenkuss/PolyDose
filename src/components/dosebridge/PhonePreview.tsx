import { useEffect, useRef } from "react";
import { Clock, MessageSquareText, Signal, Wifi } from "lucide-react";
import type { MedicationRow, ReminderLogRow } from "@/lib/dosebridge-api";
import { formatClockTime } from "@/lib/dosebridge-utils";
import { buildSmsReminderText, type LanguageCode, type TranslationDict } from "@/lib/i18n";

interface PhonePreviewProps {
  t: TranslationDict;
  language: LanguageCode;
  phoneNumber: string;
  timezone: string;
  activeMedication: MedicationRow | null;
  logs: ReminderLogRow[];
}

export function PhonePreview({
  t,
  language,
  phoneNumber,
  timezone,
  activeMedication,
  logs,
}: PhonePreviewProps) {
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [logs.length]);

  const liveText = activeMedication
    ? buildSmsReminderText(language, {
        name: activeMedication.name,
        dosage: activeMedication.dosage,
        instructions: activeMedication.instructions,
      })
    : null;

  return (
    <aside
      aria-label={t.phonePreviewTitle}
      className="space-y-3 lg:sticky lg:top-6"
    >
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
          {t.phonePreviewTitle}
        </h2>
        <p className="text-sm text-muted-foreground">{t.phonePreviewSubtitle}</p>
      </div>

      <div className="mx-auto w-full max-w-[380px] rounded-[2.25rem] bg-phone-frame p-3 shadow-lg">
        <div className="overflow-hidden rounded-[1.75rem] bg-phone-screen">
          <div className="flex items-center justify-between px-5 pt-3 pb-2 text-xs font-bold text-foreground">
            <span>9:41</span>
            <div className="h-4 w-20 rounded-full bg-phone-frame" aria-hidden="true" />
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <Signal className="h-3.5 w-3.5" />
              <Wifi className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <MessageSquareText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{t.smsHeaderSub}</p>
              <p className="truncate text-xs text-muted-foreground">
                {phoneNumber || t.phonePlaceholder}
              </p>
            </div>
          </div>

          <div
            ref={threadRef}
            className="flex h-[360px] flex-col gap-3 overflow-y-auto px-4 py-4"
          >
            {liveText ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>{t.liveTemplateLabel}</span>
                  <span>
                    {liveText.length}/150 {t.charsLabel}
                  </span>
                </div>
                <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-sms-incoming px-4 py-3 text-sm leading-relaxed text-sms-incoming-foreground shadow-xs">
                  {liveText}
                </div>
              </div>
            ) : (
              <div className="my-auto rounded-xl border border-dashed border-border bg-card p-4 text-center text-sm text-muted-foreground">
                {t.noMedPreview}
              </div>
            )}

            {logs.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <p className="text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {t.sentHistoryLabel}
                </p>
                {logs.map((log) => (
                  <div key={log.id} className="flex flex-col items-start">
                    <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-sms-incoming px-4 py-2.5 text-sm leading-relaxed text-sms-incoming-foreground shadow-xs">
                      {log.message_text}
                    </div>
                    <span className="mt-1 px-1 text-[11px] text-muted-foreground">
                      {formatClockTime(new Date(log.sent_at), timezone)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-border bg-card px-4 py-3 text-xs font-medium text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{t.waitingForSchedule}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}