import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ChapterScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();

  if (!chapterId) return null;

  return <Redirect href={`/chapter/${chapterId}/theory`} />;
}
