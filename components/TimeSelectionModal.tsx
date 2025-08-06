import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Clock, Calendar } from 'lucide-react-native';

interface TimeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (pickupTime?: string, deliveryTime?: string) => Promise<void>;
  currentPickupTime?: string;
  currentDeliveryTime?: string;
  orderStatus: string;
}

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
      slots.push({ value: time, display: displayTime });
    }
  }
  return slots;
};

const generateDateOptions = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dateString = date.toISOString().split('T')[0];
    const displayDate = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    
    dates.push({
      value: dateString,
      display: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : displayDate,
    });
  }
  
  return dates;
};

export default function TimeSelectionModal({
  visible,
  onClose,
  onSave,
  currentPickupTime,
  currentDeliveryTime,
  orderStatus,
}: TimeSelectionModalProps) {
  const [pickupDate, setPickupDate] = useState<string>(
    currentPickupTime?.split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [pickupTime, setPickupTime] = useState<string>(
    currentPickupTime?.split('T')[1]?.substring(0, 5) || '09:00'
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(
    currentDeliveryTime?.split('T')[0] || ''
  );
  const [deliveryTime, setDeliveryTime] = useState<string>(
    currentDeliveryTime?.split('T')[1]?.substring(0, 5) || '14:00'
  );
  const [loading, setLoading] = useState(false);

  const timeSlots = generateTimeSlots();
  const dateOptions = generateDateOptions();

  const canEdit = ['pending', 'confirmed'].includes(orderStatus);

  const handleSave = async () => {
    if (!canEdit) {
      Alert.alert('Cannot Edit', 'Time preferences can only be changed for pending or confirmed orders.');
      return;
    }

    setLoading(true);
    try {
      const pickupDateTime = pickupDate && pickupTime 
        ? new Date(`${pickupDate}T${pickupTime}:00`).toISOString()
        : undefined;
        
      const deliveryDateTime = deliveryDate && deliveryTime 
        ? new Date(`${deliveryDate}T${deliveryTime}:00`).toISOString()
        : undefined;

      await onSave(pickupDateTime, deliveryDateTime);
      onClose();
    } catch (error) {
      console.error('Error updating times:', error);
      Alert.alert('Error', 'Failed to update time preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Clock size={24} color="#F59E42" />
              <Text style={styles.title}>Time Preferences</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.content}>
              <Text style={styles.message}>
                Time preferences cannot be changed for orders that are already in progress. 
                Please contact customer support if you need to make changes.
              </Text>
              
              <TouchableOpacity style={styles.contactButton} onPress={onClose}>
                <Text style={styles.contactButtonText}>Close</Text>
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
            <Clock size={24} color="#3B82F6" />
            <Text style={styles.title}>Time Preferences</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Pickup Time Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Calendar size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Pickup Time</Text>
              </View>
              
              <Text style={styles.sectionSubtitle}>When would you like us to pick up your items?</Text>
              
              <View style={styles.dateTimeContainer}>
                <Text style={styles.label}>Date:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                  {dateOptions.map((date) => (
                    <TouchableOpacity
                      key={date.value}
                      style={[
                        styles.dateOption,
                        pickupDate === date.value && styles.selectedOption,
                      ]}
                      onPress={() => setPickupDate(date.value)}
                    >
                      <Text style={[
                        styles.dateText,
                        pickupDate === date.value && styles.selectedText,
                      ]}>
                        {date.display}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.dateTimeContainer}>
                <Text style={styles.label}>Time:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                  {timeSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot.value}
                      style={[
                        styles.timeOption,
                        pickupTime === slot.value && styles.selectedOption,
                      ]}
                      onPress={() => setPickupTime(slot.value)}
                    >
                      <Text style={[
                        styles.timeText,
                        pickupTime === slot.value && styles.selectedText,
                      ]}>
                        {slot.display}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Delivery Time Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Calendar size={20} color="#10B981" />
                <Text style={styles.sectionTitle}>Preferred Delivery Time</Text>
              </View>
              
              <Text style={styles.sectionSubtitle}>When would you prefer to receive your items? (Optional)</Text>
              
              <View style={styles.dateTimeContainer}>
                <Text style={styles.label}>Date:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                  <TouchableOpacity
                    style={[
                      styles.dateOption,
                      deliveryDate === '' && styles.selectedOption,
                    ]}
                    onPress={() => setDeliveryDate('')}
                  >
                    <Text style={[
                      styles.dateText,
                      deliveryDate === '' && styles.selectedText,
                    ]}>
                      No Preference
                    </Text>
                  </TouchableOpacity>
                  {dateOptions.slice(1).map((date) => (
                    <TouchableOpacity
                      key={date.value}
                      style={[
                        styles.dateOption,
                        deliveryDate === date.value && styles.selectedOption,
                      ]}
                      onPress={() => setDeliveryDate(date.value)}
                    >
                      <Text style={[
                        styles.dateText,
                        deliveryDate === date.value && styles.selectedText,
                      ]}>
                        {date.display}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {deliveryDate && (
                <View style={styles.dateTimeContainer}>
                  <Text style={styles.label}>Time:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                    {timeSlots.map((slot) => (
                      <TouchableOpacity
                        key={slot.value}
                        style={[
                          styles.timeOption,
                          deliveryTime === slot.value && styles.selectedOption,
                        ]}
                        onPress={() => setDeliveryTime(slot.value)}
                      >
                        <Text style={[
                          styles.timeText,
                          deliveryTime === slot.value && styles.selectedText,
                        ]}>
                          {slot.display}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.disabledButton]} 
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Times</Text>
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
    maxHeight: '85%',
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
    maxHeight: 400,
  },
  message: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    textAlign: 'center',
    margin: 20,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  dateTimeContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  dateScroll: {
    flexDirection: 'row',
  },
  timeScroll: {
    flexDirection: 'row',
  },
  dateOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
    minWidth: 80,
    alignItems: 'center',
  },
  timeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
    minWidth: 70,
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EEF2FF',
  },
  dateText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  selectedText: {
    color: '#3B82F6',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  contactButton: {
    padding: 16,
    margin: 20,
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
