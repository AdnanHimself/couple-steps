import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { UserService } from '../services/UserService';
import { Logger } from '../utils/Logger';
import { DebugBottomSheet } from '../components/DebugBottomSheet';

// Simple email validation helper
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const AuthScreen = ({ navigation }: any) => {
    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(true);
    const [showDebug, setShowDebug] = useState(false);

    const handleAuth = async () => {
        // Basic validation
        if (!email || !password || (isSignUp && !name)) {
            Alert.alert('Missing Information', 'Please fill in all required fields.');
            return;
        }
        if (!isValidEmail(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
            return;
        }
        if (isSignUp && name.length < 3) {
            Alert.alert('Invalid Name', 'Username must be at least 3 characters long.');
            return;
        }
        if (isSignUp) {
            const available = await UserService.checkUsernameAvailability(name.trim());
            if (!available) {
                Alert.alert('Username Taken', 'This username is already taken. Please choose another one.');
                return;
            }
        }
        setLoading(true);
        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: name.trim(),
                            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=random`,
                        },
                    },
                });
                if (error) throw error;
                if (data?.session) {
                    // Auto‑login successful – navigation handled by auth listener elsewhere
                    console.log('Sign up successful, auto‑logged in');
                } else if (data?.user && !data?.session) {
                    Alert.alert('Verification Sent', 'Please check your email to confirm your account before logging in.');
                    setIsSignUp(false);
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    if (error.message.includes('Invalid login credentials')) {
                        throw new Error('Incorrect email or password. Please try again.');
                    }
                    throw error;
                }
                // Sign‑in successful – navigation handled by auth listener
            }
        } catch (e: any) {
            Logger.error('Auth Error:', e);
            Alert.alert('Authentication Failed', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
                        <Text style={styles.subtitle}>
                            {isSignUp ? 'Sign up to start walking together.' : 'Sign in to continue your journey.'}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {isSignUp && (
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your Name"
                                    placeholderTextColor={Colors.secondary}
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                />
                            </View>
                        )}

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="hello@example.com"
                                placeholderTextColor={Colors.secondary}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={Colors.secondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading} activeOpacity={0.8}>
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.switchButton} onPress={() => setIsSignUp(!isSignUp)}>
                            <Text style={styles.switchText}>
                                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                            </Text>
                        </TouchableOpacity>

                        {/* Debug button */}
                        <TouchableOpacity style={[styles.switchButton, { marginTop: 5 }]} onPress={() => setShowDebug(true)}>
                            <Text style={styles.switchText}>Debug Logs</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            {/* Debug Bottom Sheet */}
            {showDebug && <DebugBottomSheet visible={showDebug} onClose={() => setShowDebug(false)} />}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: Layout.padding,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: Colors.secondary,
        textAlign: 'center',
    },
    form: {
        gap: 24,
    },
    inputContainer: {
        gap: 10,
    },
    label: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 4,
    },
    input: {
        backgroundColor: Colors.card,
        padding: 18,
        borderRadius: 16,
        color: Colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.border || '#334155',
    },
    button: {
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    switchButton: {
        alignItems: 'center',
        marginTop: 10,
        padding: 10,
    },
    switchText: {
        color: Colors.secondary,
        fontSize: 14,
        fontWeight: '600',
    },
});
