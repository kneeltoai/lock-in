import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { BodyRecord } from "@/types/workout";

async function fetchBodyRecords(userId: string): Promise<BodyRecord[]> {
  const { data, error } = await supabase
    .from("body_records")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function addBodyRecord(
  userId: string,
  date: string,
  weightKg?: number,
  notes?: string
): Promise<BodyRecord> {
  const { data, error } = await supabase
    .from("body_records")
    .insert({ user_id: userId, date, weight_kg: weightKg ?? null, notes: notes ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function uploadBodyPhoto(
  userId: string,
  recordId: string,
  imageUri: string
): Promise<string> {
  // uri → blob
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const ext = imageUri.split(".").pop() ?? "jpg";
  const path = `${userId}/${recordId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("body-photos")
    .upload(path, blob, { upsert: true, contentType: `image/${ext}` });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("body-photos").getPublicUrl(path);
  return data.publicUrl;
}

async function updateBodyRecordPhoto(recordId: string, photoUrl: string): Promise<void> {
  const { error } = await supabase
    .from("body_records")
    .update({ photo_url: photoUrl })
    .eq("id", recordId);
  if (error) throw error;
}

// ── 훅 ──────────────────────────────────────────────────

export function useBodyRecords() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["body-records", user?.id],
    queryFn: () => fetchBodyRecords(user!.id),
    enabled: !!user,
  });
}

export function useAddBodyRecord() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      date,
      weightKg,
      notes,
    }: {
      date: string;
      weightKg?: number;
      notes?: string;
    }) => addBodyRecord(user!.id, date, weightKg, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["body-records"] }),
  });
}

export function useUploadBodyPhoto() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ recordId, imageUri }: { recordId: string; imageUri: string }) => {
      const url = await uploadBodyPhoto(user!.id, recordId, imageUri);
      await updateBodyRecordPhoto(recordId, url);
      return url;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["body-records"] }),
  });
}

/** 이미지 피커 실행 후 URI 반환 */
export async function pickBodyPhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: true,
    aspect: [3, 4],
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
}
