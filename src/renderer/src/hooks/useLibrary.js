import { useCallback, useEffect, useState } from 'react';

const bridge = () => globalThis.api?.library ?? null;

export const mediaUrl = (path) => bridge()?.url(path) ?? '';
export const thumbUrl = (path) => bridge()?.thumbUrl(path) ?? '';

export function useLibrary() {
  const [groups, setGroups] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const api = bridge();
    if (!api) {
      setLoading(false);
      return;
    }

    const data = await api.photos();
    setGroups(data.groups);
    setFavorites(data.favorites ?? []);
    setTotal(data.total);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const isFavorite = useCallback((path) => favorites.includes(path), [favorites]);

  const toggleFavorite = useCallback(async (path) => {
    const api = bridge();
    if (!api) return;
    const now = await api.toggleFavorite(path);
    setFavorites((current) =>
      now ? [...current, path] : current.filter((item) => item !== path),
    );
  }, []);

  const remove = useCallback(
    async (path) => {
      const api = bridge();
      if (!api) return;
      await api.remove(path);
      await reload();
    },
    [reload],
  );

  return {
    groups,
    total,
    loading,
    favorites,
    isFavorite,
    toggleFavorite,
    remove,
    reload,
    supported: Boolean(bridge()),
  };
}
