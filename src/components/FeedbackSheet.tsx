import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
import { supabase } from '../lib/supabase';
// @ts-ignore
import { X, Send, Bug, Lightbulb, Palette, Zap, MessageSquare } from 'lucide-react-native';

interface FeedbackSheetProps {
    visible: boolean;
    onClose: () => void;
    userId: string;
}

const CATEGORIES = [
    { id: 'bug', label: 'Bug Report', icon: Bug },
    { id: 'feature', label: 'Feature Request', icon: Lightbulb },
    { id: 'design', label: 'Design Feedback', icon: Palette },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'other', label: 'Other', icon: MessageSquare },
];

export const FeedbackSheet: React.FC<FeedbackSheetProps> = ({ visible, onClose, userId }) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedCategory) {
            Alert.alert('Missing Info', 'Please select a category.');
            return;
        }
        if (!message.trim()) {
            Alert.alert('Missing Info', 'Please enter your feedback.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('feedback').insert({
                user_id: userId,
                category: selectedCategory,
                message: message.trim(),
            });

            if (error) throw error;

            Alert.alert('Thank You!', 'Your feedback has been sent successfully.');
            setMessage('');
            setSelectedCategory(null);
            onClose();
        } catch (error) {
            console.error('Error sending feedback:', error);
            Alert.alert('Error', 'Failed to send feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
                <View style={styles.sheet}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Send Feedback</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X color={Colors.black} size={24} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>Help us improve Couple Steps. What's on your mind?</Text>

                    {/* Categories */}
                    <Text style={styles.sectionLabel}>CATEGORY</Text>
                    <View style={styles.categoriesContainer}>
                        {CATEGORIES.map((cat) => {
                            const isSelected = selectedCategory === cat.id;
                            const Icon = cat.icon;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                                    onPress={() => setSelectedCategory(cat.id)}
                                >
                                    <Icon size={16} color={isSelected ? Colors.white : Colors.black} />
                                    <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Message Input */}
                    <Text style={styles.sectionLabel}>MESSAGE</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Tell us more..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                        value={message}
                        onChangeText={setMessage}
                    />

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.submitButtonText}>
                            {isSubmitting ? 'Sending...' : 'Submit Feedback'}
                        </Text>
                        {!isSubmitting && <Send size={20} color={Colors.white} />}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        borderRightWidth: 3,
        borderColor: Colors.black,
        padding: Layout.padding,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.black,
        borderRadius: 0,
        alignSelf: 'center',
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
    },
    closeButton: {
        padding: 4,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.black,
        marginBottom: 24,
        opacity: 0.7,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.black,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: Colors.white,
        borderWidth: 2,
        borderColor: Colors.black,
        borderRadius: 0,
    },
    categoryChipSelected: {
        backgroundColor: Colors.black,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.black,
    },
    categoryTextSelected: {
        color: Colors.white,
    },
    input: {
        backgroundColor: Colors.white,
        borderWidth: 2,
        borderColor: Colors.black,
        padding: 12,
        fontSize: 16,
        color: Colors.text,
        minHeight: 120,
        marginBottom: 24,
        borderRadius: 0,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.black,
        padding: 16,
        borderRadius: 0,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
});
