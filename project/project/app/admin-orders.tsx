
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useOrders } from '../context/OrderContext';
import type { Order } from '../services/orderService';

const ORDER_STATUSES: Order['status'][] = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];
const AdminOrdersScreen = () => {
  const { orders, loading, refreshOrders, updateOrderStatus } = useOrders();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    refreshOrders();
  }, []);

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, status);
    } catch (e) {
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const renderOrder = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.id}>Order ID: {item.id}</Text>
      <Text>User ID: {item.userID}</Text>
      <Text>Status: {item.status}</Text>
      <View style={styles.statusRow}>
        {ORDER_STATUSES.map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusBtn,
              item.status === status && styles.selectedStatus,
            ]}
            disabled={item.status === status || updatingId === item.id}
            onPress={() => handleStatusChange(item.id, status)}
          >
            <Text style={styles.statusText}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {updatingId === item.id && <ActivityIndicator size="small" color="#007bff" />}
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Order Management</Text>
      <FlatList
        data={orders}
        keyExtractor={item => item.id || ''}
        renderItem={renderOrder}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 16, marginBottom: 16, elevation: 2 },
  id: { fontWeight: 'bold', marginBottom: 4 },
  statusRow: { flexDirection: 'row', marginTop: 8 },
  statusBtn: { padding: 8, borderRadius: 6, backgroundColor: '#eee', marginRight: 8 },
  selectedStatus: { backgroundColor: '#007bff' },
  statusText: { color: '#333', fontWeight: 'bold' },
});

export default AdminOrdersScreen;
