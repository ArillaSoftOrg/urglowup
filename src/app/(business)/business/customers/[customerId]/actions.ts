"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";

const noteSchema = z.object({
  note: z.string().max(2000),
});

export type NoteActionState = { success: boolean; error?: string };

export async function upsertCustomerNote(
  customerId: string,
  _prev: NoteActionState,
  formData: FormData
): Promise<NoteActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const result = noteSchema.safeParse({ note: formData.get("note") });
  if (!result.success) return { success: false, error: result.error.issues[0].message };

  const note = result.data.note.trim();

  if (!note) {
    await db.businessCustomerNote.deleteMany({ where: { businessId, customerId } });
  } else {
    await db.businessCustomerNote.upsert({
      where: { businessId_customerId: { businessId, customerId } },
      create: { businessId, customerId, note },
      update: { note },
    });
  }

  revalidatePath(`/business/customers/${customerId}`);
  return { success: true };
}
