import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './ui/Card';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Order } from '../services/orderService';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'confirmed':
        return colors.primary;
      case 'in-progress':
        return '#3B82F6';
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.orderId, { color: colors.text }]}>
              #{order.id?.slice(-6).toUpperCase()}
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {formatDate(order.createdAt)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.details}>
          <Text style={[styles.category, { color: colors.text }]}>
            {order.category.replace('-', ' ').toUpperCase()}
          </Text>
          <Text style={[styles.address, { color: colors.textSecondary }]}>
            🏠 {order.address}
          </Text>
          {order.items && order.items.length > 0 && (
            <Text style={[styles.items, { color: colors.textSecondary }]}>
              Items: {order.items.join(', ')}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.total, { color: colors.primary }]}>
            KSH {order.total.toLocaleString()}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  details: {
    marginBottom: 12,
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    marginBottom: 4,
  },
  items: {
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
  },
});