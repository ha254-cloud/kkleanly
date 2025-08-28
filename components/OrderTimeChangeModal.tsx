import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { notifyOrderTimeChange } from '../services/orderTimeChangeNotificationService';

interface OrderTimeChangeModalProps {
  visible: boolean;
  order: any;
  onClose: () => void;
  onTimeChanged: (orderId: string, newTimes: any) => void;
}

export default function OrderTimeChangeModal({
  visible,
  order,
  onClose,
  onTimeChanged
}: OrderTimeChangeModalProps) {
  const [newPickupTime, setNewPickupTime] = useState('');
  const [newDeliveryTime, setNewDeliveryTime] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const handleSubmit = async () => {
    if (!newPickupTime) {
      Alert.alert('Error', 'Please select a new pickup time');
      return;
    }

    setIsSubmitting(true);
    try {
      // Determine change type
      let changeType: 'pickup' | 'delivery' | 'both' = 'pickup';
      if (newDeliveryTime && order.deliveryTime) {
        changeType = 'both';
      } else if (newDeliveryTime) {
        changeType = 'delivery';
      }

      // Send notifications
      const result = await notifyOrderTimeChange({
        orderId: order.id,
        userId: order.userID,
        driverId: order.assignedDriver,
        oldPickupTime: order.pickupTime,
        newPickupTime,
        oldDeliveryTime: order.deliveryTime,
        newDeliveryTime,
        reason: changeReason,
        changeType
      });

      if (result.success) {
        Alert.alert(
          'Success', 
          `Time change notifications sent to:\n${result.sentTo.join('\n')}`,
          [
            {
              text: 'OK',
              onPress: () => {
                onTimeChanged(order.id, {
                  pickupTime: newPickupTime,
                  deliveryTime: newDeliveryTime
                });
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert('Warning', result.error || 'Failed to send some notifications');
      }

    } catch (error) {
      console.error('Error changing order time:', error);
      Alert.alert('Error', 'Failed to update order time. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewPickupTime('');
    setNewDeliveryTime('');
    setChangeReason('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!order) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Change Order Time
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colors.primary }]}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Card style={styles.orderInfo}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Order Information
            </Text>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Order ID:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{order.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Current Pickup:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{order.pickupTime}</Text>
            </View>
            {order.deliveryTime && (
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Current Delivery:</Text>
                <Text style={[styles.value, { color: colors.text }]}>{order.deliveryTime}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Status:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{order.status}</Text>
            </View>
          </Card>

          <Card style={styles.timeChange}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              New Times
            </Text>
            
            <Input
              label="New Pickup Time *"
              value={newPickupTime}
              onChangeText={setNewPickupTime}
              placeholder="e.g., Tomorrow 2:00 PM"
            />

            <Input
              label="New Delivery Time (Optional)"
              value={newDeliveryTime}
              onChangeText={setNewDeliveryTime}
              placeholder="e.g., Tomorrow 6:00 PM"
            />

            <Input
              label="Reason for Change"
              value={changeReason}
              onChangeText={setChangeReason}
              placeholder="e.g., Customer requested earlier pickup"
              multiline
              numberOfLines={3}
            />
          </Card>

          <Card style={styles.notificationInfo}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🔔 Who Will Be Notified
            </Text>
            
            <View style={styles.notificationList}>
              <View style={styles.notificationItem}>
                <Text style={[styles.notificationRole, { color: colors.primary }]}>
                  Admin
                </Text>
                <Text style={[styles.notificationEmail, { color: colors.textSecondary }]}>
                  kleanlyspt@gmail.com
                </Text>
              </View>

              {order.assignedDriver && (
                <View style={styles.notificationItem}>
                  <Text style={[styles.notificationRole, { color: colors.primary }]}>
                    Driver
                  </Text>
                  <Text style={[styles.notificationEmail, { color: colors.textSecondary }]}>
                    {order.assignedDriver}
                  </Text>
                </View>
              )}

              <View style={styles.notificationItem}>
                <Text style={[styles.notificationRole, { color: colors.primary }]}>
                  Customer
                </Text>
                <Text style={[styles.notificationEmail, { color: colors.textSecondary }]}>
                  Order owner
                </Text>
              </View>
            </View>
          </Card>

          <View style={styles.buttons}>
            <Button
              title="Cancel"
              onPress={handleClose}
              variant="outline"
              style={styles.button}
            />
            
            <Button
              title={isSubmitting ? 'Updating...' : 'Update Time & Notify'}
              onPress={handleSubmit}
              disabled={isSubmitting || !newPickupTime}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  orderInfo: {
    marginBottom: 20,
  },
  timeChange: {
    marginBottom: 20,
  },
  notificationInfo: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
  },
  notificationList: {
    gap: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  notificationRole: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  notificationEmail: {
    fontSize: 12,
    flex: 2,
    textAlign: 'right',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    flex: 1,
  },
});
