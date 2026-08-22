/* Accent- and case-insensitive: nobody types "Cámara" with the accent in
   a search box, and a search that punishes them for it is broken. */
const fold = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/* Every term has to match something, so each word the user adds narrows
   the result rather than widening it. */
export const filterGroups = (groups, query) => {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return groups;

  return groups
    .map((group) => {
      const shared = fold(`${group.label} ${group.year}`);

      const photos = group.photos.filter((photo) => {
        const haystack = `${shared} ${fold(photo.name)} ${fold(photo.category)} ${fold(
          photo.camera,
        )} ${fold(photo.lens)}`;
        return terms.every((term) => haystack.includes(term));
      });

      return { ...group, photos, count: photos.length };
    })
    .filter((group) => group.photos.length);
};

export const countPhotos = (groups) =>
  groups.reduce((total, group) => total + group.photos.length, 0);
