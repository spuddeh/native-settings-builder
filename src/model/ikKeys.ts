// Curated list of IK_* input key names usable as key-binding defaults.
// Sourced from the game's EInputKey enum (common, bindable keys only).

export const IK_KEYS: string[] = [
  // Function keys
  'IK_F1', 'IK_F2', 'IK_F3', 'IK_F4', 'IK_F5', 'IK_F6',
  'IK_F7', 'IK_F8', 'IK_F9', 'IK_F10', 'IK_F11', 'IK_F12',
  // Letters
  'IK_A', 'IK_B', 'IK_C', 'IK_D', 'IK_E', 'IK_F', 'IK_G', 'IK_H', 'IK_I',
  'IK_J', 'IK_K', 'IK_L', 'IK_M', 'IK_N', 'IK_O', 'IK_P', 'IK_Q', 'IK_R',
  'IK_S', 'IK_T', 'IK_U', 'IK_V', 'IK_W', 'IK_X', 'IK_Y', 'IK_Z',
  // Digits
  'IK_0', 'IK_1', 'IK_2', 'IK_3', 'IK_4', 'IK_5', 'IK_6', 'IK_7', 'IK_8', 'IK_9',
  // Numpad
  'IK_NumPad0', 'IK_NumPad1', 'IK_NumPad2', 'IK_NumPad3', 'IK_NumPad4',
  'IK_NumPad5', 'IK_NumPad6', 'IK_NumPad7', 'IK_NumPad8', 'IK_NumPad9',
  'IK_Multiply', 'IK_Add', 'IK_Subtract', 'IK_Decimal', 'IK_Divide',
  // Modifiers and control keys
  'IK_LShift', 'IK_RShift', 'IK_LControl', 'IK_RControl', 'IK_LAlt', 'IK_RAlt',
  'IK_Space', 'IK_Enter', 'IK_Backspace', 'IK_Tab', 'IK_CapsLock',
  // Navigation
  'IK_Insert', 'IK_Delete', 'IK_Home', 'IK_End', 'IK_PageUp', 'IK_PageDown',
  'IK_Up', 'IK_Down', 'IK_Left', 'IK_Right',
  // Punctuation
  'IK_Tilde', 'IK_Minus', 'IK_Equals', 'IK_LeftBracket', 'IK_RightBracket',
  'IK_Backslash', 'IK_Semicolon', 'IK_Quote', 'IK_Comma', 'IK_Period', 'IK_Slash',
  // Mouse
  'IK_LeftMouseButton', 'IK_RightMouseButton', 'IK_MiddleMouseButton',
  'IK_ThumbMouseButton', 'IK_ThumbMouseButton2',
]

/** Display form for the preview: "IK_F5" -> "F5". */
export function ikDisplay(key: string): string {
  return key.replace(/^IK_/, '')
}
