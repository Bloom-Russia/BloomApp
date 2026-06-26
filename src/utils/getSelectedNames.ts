export const getSelectedNames = (
  selectedIDs: string[] | null | undefined,
  values: { id: string; name: string }[],
) => {
  if (!values.length || !selectedIDs?.length) {
    return null;
  }

  const selectedItems = values.filter((item) => selectedIDs.includes(item.id));
  if (selectedItems.length) {
    return selectedItems.map((item) => item.name).join(', ');
  }

  return null;
};
