import { useMemo } from "react";
import { Check, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMMON_TIMEZONES } from "@/lib/dosebridge-utils";
import type { TranslationDict } from "@/lib/i18n";

interface ProfileBarProps {
  t: TranslationDict;
  phone: string;
  timezone: string;
  isSaving: boolean;
  onPhoneChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  onSave: () => void;
}

export function ProfileBar({
  t,
  phone,
  timezone,
  isSaving,
  onPhoneChange,
  onTimezoneChange,
  onSave,
}: ProfileBarProps) {
  const timezoneOptions = useMemo(() => {
    const list: string[] = [...COMMON_TIMEZONES];
    if (timezone && !list.includes(timezone)) {
      list.unshift(timezone);
    }
    return list;
  }, [timezone]);

  return (
    <section
      aria-label={t.profileTitle}
      className="rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        className="grid grid-cols-1 items-end gap-4 md:grid-cols-[1fr_1fr_auto]"
      >
        <div className="space-y-1.5">
          <Label htmlFor="patient-phone" className="flex items-center gap-1.5 text-sm font-bold">
            <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.phoneLabel}
          </Label>
          <Input
            id="patient-phone"
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder={t.phonePlaceholder}
            className="h-11 bg-background text-base"
            autoComplete="tel"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="patient-tz" className="flex items-center gap-1.5 text-sm font-bold">
            <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.timezoneLabel}
          </Label>
          <Select value={timezone} onValueChange={onTimezoneChange}>
            <SelectTrigger id="patient-tz" className="h-11 bg-background text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezoneOptions.map((tz) => (
                <SelectItem key={tz} value={tz} className="text-base">
                  {tz.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={isSaving}
          className="h-11 min-w-36 px-5 text-base font-bold"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          {isSaving ? t.saving : t.saveProfile}
        </Button>
      </form>
    </section>
  );
}