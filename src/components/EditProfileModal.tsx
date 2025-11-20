import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
import { UserService } from '../services/UserService';
import { useApp } from '../context/AppContext';
import { X } from 'lucide-react-native';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose }) => {
    const { currentUser, setCurrentUser } = useApp();
    const [username, setUsername] = useState(currentUser?.username || '');
    const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!currentUser) return;
        if (!username.trim()) {
            Alert.alert('Error', 'Username cannot be empty');
            return;
        }

        setLoading(true);
        const success = await UserService.updateProfile(currentUser.id, {
            username: username.trim(),
            avatarUrl: avatarUrl.trim()
        });

        if (success) {
            setCurrentUser({
                ...currentUser,
                username: username.trim(),
                avatarUrl: avatarUrl.trim()
            });
            Alert.alert('Success', 'Profile updated successfully!');
            onClose();
        } else {
            Alert.alert('Error', 'Failed to update profile');
        }
        setLoading(false);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Edit Profile</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            {/* @ts-ignore */}
                            <X size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Enter username"
                            placeholderTextColor={Colors.textSecondary}
                            autoCapitalize="none"
                        />

                        <Text style={styles.label}>Avatar URL</Text>
                        <TextInput
                            style={styles.input}
                            value={avatarUrl}
                            onChangeText={setAvatarUrl}
                            placeholder="https://example.com/avatar.jpg"
                            placeholderTextColor={Colors.textSecondary}
                            autoCapitalize="none"
                        />

                        <TouchableOpacity
                            style={[styles.saveButton, loading && styles.disabledButton]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            <Text style={styles.saveButtonText}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
        minHeight: '50%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    closeButton: {
        padding: 5,
    },
    form: {
        gap: 15,
    },
    label: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 5,
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 15,
        color: Colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
