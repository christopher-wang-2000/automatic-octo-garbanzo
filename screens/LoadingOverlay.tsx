import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function LoadingOverlay({ message }) {
    return (
        <View style={styles.rootContainer}>
            <Text style={styles.message}>{message}</Text>
            <ActivityIndicator size="large" />
        </View>
    )
}

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32
    },
    message: {
        
    }
})