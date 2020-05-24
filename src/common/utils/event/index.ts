export const isModifiedEvent = (event: { [key: string]: any }) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

export const isKeyboardEvent = (event: any): event is KeyboardEvent =>
  ['keypress', 'keydown', 'keyup'].includes(event.type);
