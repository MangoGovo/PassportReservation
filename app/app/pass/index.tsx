import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function CurrentPassRoute() {
  const router = useRouter();

  useEffect(() => {
    router.replace({ pathname: '/', params: { tab: 'pass' } });
  }, [router]);

  return null;
}
