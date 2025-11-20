import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
import { Heart, X } from 'lucide-react-native';

interface NudgeModalProps {
    visible: boolean;
    senderName: string;
    message: string;
    onClose: () => void;
    onReply: () => void;
}

const { width } = Dimensions.get('window');

export const NudgeModal: React.FC<NudgeModalProps> = ({
    visible,
    senderName,
    message,
    onClose,
    onReply,
}) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <X color={Colors.textSecondary} size={20} />
                    </TouchableOpacity>

                    {/* Heart Icon */}
                    <View style={styles.iconContainer}>
                        <Heart color={Colors.white} size={48} fill={Colors.primary} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>💕 Nudge from {senderName}</Text>

                    {/* Message */}
                    <Text style={styles.message}>{message}</Text>

                    {/* Action Button */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {
                            onReply();
                            onClose();
                        }}
                        activeOpacity={0.8}
                    >
                        <Heart color={Colors.white} size={18} fill={Colors.white} />
                        <Text style={styles.buttonText}>Nudge Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: Colors.surface,
        borderRadius: Layout.borderRadius * 2,
        padding: 32,
        width: width * 0.85,
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
        zIndex: 10,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${Colors.primary}20`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 22,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: Layout.borderRadius,
        width: '100%',
        gap: 10,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.white,
    },
});
