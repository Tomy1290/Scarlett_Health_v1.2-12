import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

export type PhotoMeta = { uri: string; thumbUri: string; width: number; height: number; size: number; createdAt: number };

export async function pickAndCompress(maxEdge = 1600, quality = 0.6): Promise<PhotoMeta | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (perm.status !== 'granted') return null;
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1, allowsEditing: true, aspect: [4,3] });
  if (res.canceled || !res.assets?.[0]?.uri) return null;
  return await compressAsset(res.assets[0].uri, maxEdge, quality);
}

export async function captureAndCompress(maxEdge = 1600, quality = 0.6): Promise<PhotoMeta | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (perm.status !== 'granted') return null;
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1, allowsEditing: true, aspect: [4,3] });
  if (res.canceled || !res.assets?.[0]?.uri) return null;
  return await compressAsset(res.assets[0].uri, maxEdge, quality);
}

async function compressAsset(uri: string, maxEdge = 1600, quality = 0.6): Promise<PhotoMeta> {
  const info = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: maxEdge } }], { compress: quality, format: ImageManipulator.SaveFormat.JPEG });
  const stat = await FileSystem.getInfoAsync(info.uri);
  const fileSize = Math.round((stat.size as number) || 0);

  // thumbnail
  const thumb = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 300 } }], { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG });
  return { uri: info.uri, thumbUri: thumb.uri, width: info.width || 0, height: info.height || 0, size: fileSize, createdAt: Date.now() };
}

export async function deletePhoto(meta: PhotoMeta) {
  try { await FileSystem.deleteAsync(meta.uri, { idempotent: true }); } catch {}
  try { await FileSystem.deleteAsync(meta.thumbUri, { idempotent: true }); } catch {}
}