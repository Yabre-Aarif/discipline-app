import { Alert, Platform } from "react-native";

// Alert.alert() is a no-op on react-native-web, so confirmation dialogs
// silently never appear there. Fall back to window.confirm on web.
export function confirmAction(options: {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  const { title, message, confirmLabel, destructive, onConfirm } = options;

  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: "Annuler", style: "cancel" },
    { text: confirmLabel, style: destructive ? "destructive" : "default", onPress: onConfirm },
  ]);
}
