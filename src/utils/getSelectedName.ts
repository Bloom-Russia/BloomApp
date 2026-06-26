export const getSelectedName = (
  selectedID: string | null | undefined,
  values: { id: string; name: string }[],
) => {
  if (!selectedID) {
    return null;
  }
  return values.find((value) => value.id === selectedID)?.name || null;
};
