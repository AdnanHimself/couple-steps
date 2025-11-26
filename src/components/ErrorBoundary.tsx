import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    private handleCopyError = async () => {
        const errorText = `Error: ${this.state.error?.toString()}\n\nStack: ${this.state.errorInfo?.componentStack}`;
        await Clipboard.setStringAsync(errorText);
        Alert.alert('Copied', 'Error details copied to clipboard');
    };

    private handleRestart = () => {
        // Simple reload attempt (might not work in all RN envs, but resets state)
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <SafeAreaView style={styles.container}>
                    <ScrollView contentContainerStyle={styles.content}>
                        <Text style={styles.title}>Oops! Something went wrong.</Text>
                        <Text style={styles.subtitle}>
                            Please take a screenshot or copy this error and send it to the developer.
                        </Text>

                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
                            <Text style={styles.stackText}>{this.state.errorInfo?.componentStack}</Text>
                        </View>

                        <TouchableOpacity style={styles.button} onPress={this.handleCopyError}>
                            <Text style={styles.buttonText}>Copy Error Details</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={this.handleRestart}>
                            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Try Again</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.danger,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 20,
    },
    errorBox: {
        backgroundColor: '#f8d7da',
        padding: 15,
        borderRadius: 8,
        width: '100%',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#f5c6cb',
    },
    errorText: {
        color: '#721c24',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    stackText: {
        color: '#721c24',
        fontSize: 12,
        fontFamily: 'monospace',
    },
    button: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginBottom: 10,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    secondaryButtonText: {
        color: Colors.primary,
    },
});
