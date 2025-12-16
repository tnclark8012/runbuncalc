export function selectField(): (state: RootState) => FieldState {
  return (state: RootState) => state.field;
}