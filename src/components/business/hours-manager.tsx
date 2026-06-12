"use client";

import { useActionState, useState } from "react";
import { CalendarDays, Check, Clock, Coffee, Info, Plus, Timer, Users } from "lucide-react";
import {
  saveBusinessHours,
  type HoursActionState,
} from "@/app/(business)/business/hours/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type TimeBlockData = {
  startTime: string;
  endTime: string;
};

export type HourData = {
  dayOfWeek: string;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  slotIntervalMinutes: number;
  appointmentBufferMinutes: number;
  workBlocks: TimeBlockData[];
  breakBlocks: TimeBlockData[];
  staffNotes: string | null;
  exceptionNotes: string | null;
};

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Pazartesi",
  TUESDAY: "Salı",
  WEDNESDAY: "Çarşamba",
  THURSDAY: "Perşembe",
  FRIDAY: "Cuma",
  SATURDAY: "Cumartesi",
  SUNDAY: "Pazar",
};

const SLOT_OPTIONS = [15, 30, 45, 60];
const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30];

function blockAt(blocks: TimeBlockData[], index: number, fallback: TimeBlockData) {
  return blocks[index] ?? fallback;
}

export function HoursManager({ initialHours }: { initialHours: HourData[] }) {
  const initial: HoursActionState = { success: false };
  const [state, formAction, isPending] = useActionState(saveBusinessHours, initial);
  const [openDays, setOpenDays] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const h of initialHours) map[h.dayOfWeek] = h.isOpen;
    return map;
  });

  function toggleDay(day: string) {
    setOpenDays((prev) => ({ ...prev, [day]: !prev[day] }));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Çalışma Saatleri</h1>
          <Badge variant="secondary">Gelişmiş program</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Açık saatleri, randevu aralıklarını, sabit molaları, hizmet sürelerini ve personel notlarını tek programda yönetin.
        </p>
      </div>

      {state.success && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/15 p-3 text-sm text-success-foreground">
          <Check className="size-4 shrink-0" />
          {state.message}
        </div>
      )}

      {state.message && !state.success && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="size-5" />
            Haftalık Program
          </CardTitle>
          <CardDescription>
            Her gün için çalışma bloğu, öğle arası, randevu tamponu ve özel notları ayarlayın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {initialHours.map((hour) => {
              const day = hour.dayOfWeek;
              const isOpen = openDays[day] ?? false;
              const work1 = blockAt(hour.workBlocks, 0, {
                startTime: hour.openTime ?? "09:00",
                endTime: hour.closeTime ?? "18:00",
              });
              const work2 = blockAt(hour.workBlocks, 1, { startTime: "", endTime: "" });
              const break1 = blockAt(hour.breakBlocks, 0, { startTime: "12:30", endTime: "13:30" });
              const break2 = blockAt(hour.breakBlocks, 1, { startTime: "", endTime: "" });

              return (
                <section
                  key={day}
                  className="rounded-lg border border-border/70 bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        name={`${day}_isOpen`}
                        checked={isOpen}
                        onChange={() => toggleDay(day)}
                        className="size-4 rounded border-input"
                      />
                      <div>
                        <h2 className="text-sm font-semibold">{DAY_LABELS[day]}</h2>
                        <p className="text-xs text-muted-foreground">
                          {isOpen ? "Randevu alınabilir" : "Kapalı gün"}
                        </p>
                      </div>
                      {!isOpen && <Badge variant="secondary">Kapalı</Badge>}
                    </div>

                    {isOpen && (
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label htmlFor={`${day}_slotIntervalMinutes`} className="text-xs">
                            Slot süresi
                          </Label>
                          <select
                            id={`${day}_slotIntervalMinutes`}
                            name={`${day}_slotIntervalMinutes`}
                            defaultValue={hour.slotIntervalMinutes}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          >
                            {SLOT_OPTIONS.map((minutes) => (
                              <option key={minutes} value={minutes}>
                                {minutes} dk
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`${day}_appointmentBufferMinutes`} className="text-xs">
                            Randevu sonrası mola
                          </Label>
                          <select
                            id={`${day}_appointmentBufferMinutes`}
                            name={`${day}_appointmentBufferMinutes`}
                            defaultValue={hour.appointmentBufferMinutes}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          >
                            {BUFFER_OPTIONS.map((minutes) => (
                              <option key={minutes} value={minutes}>
                                {minutes === 0 ? "Yok" : `${minutes} dk`}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Hizmet süresi</Label>
                          <div className="flex h-9 items-center gap-2 rounded-md border border-input px-2 text-xs text-muted-foreground">
                            <Timer className="size-3.5" />
                            Hizmetlerden alınır
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {isOpen && (
                    <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label htmlFor={`${day}_openTime`} className="text-xs">
                              Gün açılışı
                            </Label>
                            <Input id={`${day}_openTime`} name={`${day}_openTime`} type="time" defaultValue={hour.openTime ?? "09:00"} />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`${day}_closeTime`} className="text-xs">
                              Gün kapanışı
                            </Label>
                            <Input id={`${day}_closeTime`} name={`${day}_closeTime`} type="time" defaultValue={hour.closeTime ?? "18:00"} />
                          </div>
                        </div>

                        <div className="rounded-md border border-border/70 p-3">
                          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                            <CalendarDays className="size-4" />
                            Çalışma blokları
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <TimeRangeFields day={day} prefix="workBlock1" label="Blok 1" block={work1} />
                            <TimeRangeFields day={day} prefix="workBlock2" label="Blok 2" block={work2} optional />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-md border border-border/70 p-3">
                          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                            <Coffee className="size-4" />
                            Molalar
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <TimeRangeFields day={day} prefix="breakBlock1" label="Öğle arası" block={break1} optional />
                            <TimeRangeFields day={day} prefix="breakBlock2" label="Ek mola" block={break2} optional />
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label htmlFor={`${day}_staffNotes`} className="flex items-center gap-1 text-xs">
                              <Users className="size-3.5" />
                              Personel detayı
                            </Label>
                            <Input
                              id={`${day}_staffNotes`}
                              name={`${day}_staffNotes`}
                              defaultValue={hour.staffNotes ?? ""}
                              placeholder="Ayşe 09:00-17:00"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`${day}_exceptionNotes`} className="flex items-center gap-1 text-xs">
                              <Info className="size-3.5" />
                              Özel gün notu
                            </Label>
                            <Input
                              id={`${day}_exceptionNotes`}
                              name={`${day}_exceptionNotes`}
                              defaultValue={hour.exceptionNotes ?? ""}
                              placeholder="Bayram haftası kısa mesai"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isOpen && (
                    <>
                      <input type="hidden" name={`${day}_slotIntervalMinutes`} value={hour.slotIntervalMinutes} />
                      <input type="hidden" name={`${day}_appointmentBufferMinutes`} value={hour.appointmentBufferMinutes} />
                    </>
                  )}

                  {state.errors?.[day] && (
                    <p className="mt-3 text-xs text-destructive">{state.errors[day]}</p>
                  )}
                </section>
              );
            })}

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Plus className="size-3.5" />
                Daha detaylı personel takvimleri için personel notlarını bugünlük açıklama olarak kullanabilirsiniz.
              </p>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Kaydediliyor..." : "Çalışma Saatlerini Kaydet"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function TimeRangeFields({
  day,
  prefix,
  label,
  block,
  optional = false,
}: {
  day: string;
  prefix: string;
  label: string;
  block: TimeBlockData;
  optional?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <Input
          aria-label={`${label} başlangıç`}
          name={`${day}_${prefix}Start`}
          type="time"
          defaultValue={block.startTime}
          placeholder={optional ? "Opsiyonel" : undefined}
        />
        <Input
          aria-label={`${label} bitiş`}
          name={`${day}_${prefix}End`}
          type="time"
          defaultValue={block.endTime}
          placeholder={optional ? "Opsiyonel" : undefined}
        />
      </div>
    </div>
  );
}
