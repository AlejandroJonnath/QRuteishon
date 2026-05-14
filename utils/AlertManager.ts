export type AlertButton = {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
};

export type AlertOptions = {
    title: string;
    message?: string;
    buttons?: AlertButton[];
};

class AlertManager {
    private listener: ((options: AlertOptions) => void) | null = null;

    setListener(listener: (options: AlertOptions) => void) {
        this.listener = listener;
    }

    alert(title: string, message?: string, buttons?: AlertButton[]) {
        if (this.listener) {
            this.listener({ title, message, buttons });
        } else {
            // Fallback to native alert if not mounted (e.g. extremely early errors)
            import('react-native').then(({ Alert }) => {
                Alert.alert(title, message, buttons);
            });
        }
    }
}

export const CustomAlert = new AlertManager();
