import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, AlertTriangle } from 'lucide-react-native';

interface OrderCancellationModalProps {
  visible: boolean;
  onClose: () => void;
  onCancel: (reason: string) => Promise<void>;
  orderStatus: string;
}

const cancellationReasons = [
  'Changed my mind',
  'Found better pricing elsewhere',
  'No longer need the service',
  'Need to reschedule',
  'Service not available in my area',
  'Other (please specify)',
];

export default function OrderCancellationModal({
  visible,
  onClose,
  onCancel,
  orderStatus,
}: OrderCancellationModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const canCancel = ['pending', 'confirmed'].includes(orderStatus);

  const handleCancel = async () => {
    if (!selectedReason) {
      Alert.alert('Please select a reason', 'You must select a reason for cancellation');
      return;
    }

    const finalReason = selectedReason === 'Other (please specify)' 
      ? customReason.trim() 
      : selectedReason;

    if (selectedReason === 'Other (please specify)' && !finalReason) {
      Alert.alert('Please specify reason', 'Please provide a specific reason for cancellation');
      return;
    }

    Alert.alert(
      'Confirm Cancellation',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'No, Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel Order',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await onCancel(finalReason);
              onClose();
              setSelectedReason('');
              setCustomReason('');
            } catch (error) {
              console.error('Error cancelling order:', error);
              Alert.alert('Error', 'Failed to cancel order. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!canCancel) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <AlertTriangle size={24} color="#F59E42" />
              <Text style={styles.title}>Cannot Cancel Order</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.content}>
              <Text style={styles.message}>
                Orders that are already in progress or completed cannot be cancelled. 
                Please contact customer support if you need assistance.
              </Text>
              
              <TouchableOpacity style={styles.contactButton} onPress={onClose}>
                <Text style={styles.contactButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <AlertTriangle size={24} color="#EF4444" />
            <Text style={styles.title}>Cancel Order</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.subtitle}>
              Please select a reason for cancelling your order:
            </Text>

            <View style={styles.reasonsList}>
              {cancellationReasons.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonOption,
                    selectedReason === reason && styles.selectedReason,
                  ]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <View style={[
                    styles.radioButton,
                    selectedReason === reason && styles.radioButtonSelected,
                  ]}>
                    {selectedReason === reason && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={[
                    styles.reasonText,
                    selectedReason === reason && styles.selectedReasonText,
                  ]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedReason === 'Other (please specify)' && (
              <View style={styles.customReasonContainer}>
                <Text style={styles.customReasonLabel}>Please specify:</Text>
                <TextInput
                  style={styles.customReasonInput}
                  value={customReason}
                  onChangeText={setCustomReason}
                  placeholder="Enter your reason here..."
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
                <Text style={styles.characterCount}>{customReason.length}/200</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.keepButton} onPress={onClose}>
              <Text style={styles.keepButtonText}>Keep Order</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cancelButton, loading && styles.disabledButton]} 
              onPress={handleCancel}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 20,
    lineHeight: 24,
  },
  message: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  reasonsList: {
    gap: 12,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  selectedReason: {
    borderColor: '#3B82F6',
    backgroundColor: '#EEF2FF',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#3B82F6',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  reasonText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  selectedReasonText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  customReasonContainer: {
    marginTop: 16,
  },
  customReasonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  customReasonInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  keepButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  keepButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  contactButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
