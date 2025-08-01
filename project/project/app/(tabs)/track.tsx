 import { WhatsAppButton } from '../../components/ui/WhatsAppButton';
import { LiveTrackingMap } from '../../components/LiveTrackingMap';
import React from 'react';
import { Alert, Dimensions, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { formatOrderId, formatDate } from '@/utils/formatters';
import { Package, MapPin, Calendar, Award, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'react-native-svg';

// Example colors object, replace with your theme or actual color values as needed
const colors = {
  text: '#222222',
  textSecondary: '#888888',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E42',
  border: '#E5E7EB',
};

const { width } = Dimensions.get('window');
         {/* Order Details */}
         {/* Make sure selectedOrder is defined above, for example: */}
         {/* const selectedOrder = ...; */}
         {/*
           TODO: Replace this mock with actual order selection logic or prop.
           Example: const selectedOrder = orders.find(order => order.id === selectedOrderId);
         */}
         const selectedOrder = {
           id: 'ORDER123',
           createdAt: new Date(),
           status: 'pending',
           category: 'laundry',
           address: '123 Main St',
           total: 2500,
           items: ['Shirt', 'Pants', 'Jacket'],
         };
         {selectedOrder && (
-          <View style={styles.orderSection}>
-            <LinearGradient
-              colors={['#FFFFFF', '#F8FAFF']}
-              style={styles.orderGradient}
-            >
-              <Card style={styles.orderCard}>
-                {/* Order Header */}
-                <View style={styles.orderHeader}>
-                  <View style={styles.orderHeaderLeft}>
-                    <Text style={[styles.orderId, { color: colors.text }]}>
-                      {formatOrderId(selectedOrder.id)}
-                    </Text>
-                    <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
-                      Placed on {formatDate(selectedOrder.createdAt)}
-                    </Text>
-                  </View>
-                  <View style={[
-                    styles.statusBadge, 
-                    { backgroundColor: getStatusColor(selectedOrder.status) + '20' }
-                  ]}>
-                    {getStatusIcon(selectedOrder.status)}
-                    <Text style={[
-                      styles.statusText, 
-                      { color: getStatusColor(selectedOrder.status) }
-                    ]}>
-                      {selectedOrder.status.toUpperCase()}
-                    </Text>
-                  </View>
-                </View>
-
-                {/* Order Summary */}
-                <View style={styles.orderSummary}>
-                  <View style={styles.summaryRow}>
-                    <View style={[styles.summaryIcon, { backgroundColor: colors.primary + '20' }]}>
-                      <Package size={16} color={colors.primary} />
-                    </View>
-                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Service:</Text>
-                    <Text style={[styles.summaryValue, { color: colors.text }]}>
-                      {selectedOrder.category.replace('-', ' ').toUpperCase()}
-                    </Text>
-                  </View>
-                  
-                  <View style={styles.summaryRow}>
-                    <View style={[styles.summaryIcon, { backgroundColor: colors.success + '20' }]}>
-                      <MapPin size={16} color={colors.success} />
-                    </View>
-                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Area:</Text>
-                    <Text style={[styles.summaryValue, { color: colors.text }]}>
-                      {selectedOrder.address}
-                    </Text>
-                  </View>
-                  
-                  <View style={styles.summaryRow}>
-                    <View style={[styles.summaryIcon, { backgroundColor: colors.warning + '20' }]}>
-                      <Calendar size={16} color={colors.warning} />
-                    </View>
-                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Est. Delivery:</Text>
-                    <Text style={[styles.summaryValue, { color: colors.text }]}>
-                      {getEstimatedDelivery(selectedOrder)}
-                    </Text>
-                  </View>
-                  
-                  <View style={[styles.summaryRow, styles.totalRow]}>
-                    <View style={[styles.summaryIcon, { backgroundColor: colors.primary + '20' }]}>
-                      <Award size={16} color={colors.primary} />
-                    </View>
-                    <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: '700' }]}>Total:</Text>
-                    <Text style={[styles.totalAmount, { color: colors.primary }]}>
-                      KSH {selectedOrder.total.toLocaleString()}
-                    </Text>
-                  </View>
-                </View>
-              </Card>
-            </LinearGradient>
-
-            {/* Progress Timeline */}
-            <LinearGradient
-              colors={['#FFFFFF', '#F8FAFF']}
-              style={styles.progressGradient}
-            >
-              <Card style={styles.progressCard}>
-                <View style={styles.progressHeader}>
-                  <View style={[styles.progressIconContainer, { backgroundColor: colors.primary + '20' }]}>
-                    <TrendingUp size={24} color={colors.primary} />
-                  </View>
-                  <View style={styles.progressHeaderText}>
-                    <Text style={[styles.progressTitle, { color: colors.text }]}>
-                      Order Progress
-                    </Text>
-                    <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
-                      Track your order journey step by step
-                    </Text>
-                  </View>
-                </View>
-                
-                <View style={styles.timelineContainer}>
-                  {getStatusSteps(selectedOrder.status).map((step, index) => (
-                    <View key={step.key} style={styles.timelineStep}>
-                      <View style={styles.timelineIndicator}>
-                        <View
-                          style={[
-                            styles.timelineDot,
-                            {
-                              backgroundColor: step.isActive ? getStatusColor(selectedOrder.status) : colors.border,
-                            },
-                          ]}
-                        >
-                          {step.isActive && step.icon}
-                        </View>
-                        {index < 3 && (
-                          <View
-                            style={[
-                              styles.timelineLine,
-                              {
-                                backgroundColor: step.isActive && index < getStatusSteps(selectedOrder.status).findIndex(s => s.isCurrent) 
-                                  ? getStatusColor(selectedOrder.status) 
-                                  : colors.border,
-                              },
-                            ]}
-                          />
-                        )}
-                      </View>
-                      <View style={styles.timelineContent}>
-                        <Text
-                          style={[
-                            styles.timelineLabel,
-                            {
-                              color: step.isActive ? colors.text : colors.textSecondary,
-                              fontWeight: step.isCurrent ? '700' : '600',
-                            },
-                          ]}
-                        >
-                          {step.label}
-                        </Text>
-                        <Text style={[styles.timelineDescription, { color: colors.textSecondary }]}>
-                          {step.description}
-                        </Text>
-                        {step.isCurrent && (
-                          <View style={[styles.currentBadge, { backgroundColor: getStatusColor(selectedOrder.status) + '20' }]}>
+                          <View style={[styles.currentBadge, { backgroundColor: getStatusColor(selectedOrder.status) + '20' }]}>
-                            <Text style={[styles.currentBadgeText, { color: getStatusColor(selectedOrder.status) }]}>
-                              Current Status
-                            </Text>
-                          </View>
-                        )}
-                      </View>
-                    </View>
-                  ))}
-                </View>
-              </Card>
-            </LinearGradient>
-
-            {/* Items List */}
-            {selectedOrder.items && selectedOrder.items.length > 0 && (
-              <LinearGradient
-                colors={['#FFFFFF', '#F8FAFF']}
-                style={styles.itemsGradient}
-              >
-                <Card style={styles.itemsCard}>
-                  <View style={styles.itemsHeader}>
-                    <View style={[styles.itemsIconContainer, { backgroundColor: colors.success + '20' }]}>
-                      <Package size={24} color={colors.success} />
-                    </View>
-                    <View style={styles.itemsHeaderText}>
-                      <Text style={[styles.itemsTitle, { color: colors.text }]}>
-                        Items in Order ({selectedOrder.items.length})
-                      </Text>
-                      <Text style={[styles.itemsSubtitle, { color: colors.textSecondary }]}>
-                        Your laundry items being processed
-                      </Text>
-                    </View>
-                  </View>
-                  
-                  <View style={styles.itemsList}>
-                    {selectedOrder.items.map((item, index) => (
-                      <View key={index} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
-                        <View style={[styles.itemIcon, { backgroundColor: colors.primary + '15' }]}>
-                          <Text style={[styles.itemNumber, { color: colors.primary }]}>
-                            {index + 1}
-                          </Text>
-                        </View>
-                        <Text style={[styles.itemText, { color: colors.text }]}>
-                          {item}
-                        </Text>
-                      </View>
-                    ))}
-                  </View>
-                </Card>
-              </LinearGradient>
-            )}
-          </View>
+          <LiveTrackingMap 
+            orderId={selectedOrder.id!}
+            onDriverCall={(phone) => Alert.alert('Call Driver', `Calling ${phone}`)}
+            onDriverMessage={(phone) => Alert.alert('Message Driver', `Messaging ${phone}`)}
+          />
         )}

function getStatusColor(status: string) {
    throw new Error('Function not implemented.');
}
