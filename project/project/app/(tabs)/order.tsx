import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Dimensions,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Plus, Minus, ShoppingCart, MapPin, Clock, Phone, Sparkles, Package2, Info, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PaymentModal } from '../../components/PaymentModal';
import { OrderConfirmationModal } from '../../components/OrderConfirmationModal';
import { ReceiptModal } from '../../components/ReceiptModal';
import { WhatsAppButton } from '../../components/ui/WhatsAppButton';
import { orderService } from '../../services/orderService';
import { notificationService } from '../../services/notificationService';

const { width } = Dimensions.get('window');

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem extends ServiceItem {
  quantity: number;
}

interface BagService {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface BagCartItem extends BagService {
  quantity: number;
}

const services: ServiceItem[] = [
  // Wash & Fold
  { id: 'shirt', name: 'Shirt', price: 150, category: 'wash-fold' },
  { id: 'trouser', name: 'Trouser', price: 200, category: 'wash-fold' },
  { id: 'dress', name: 'Dress', price: 250, category: 'wash-fold' },
  { id: 'bedsheet', name: 'Bed Sheet', price: 300, category: 'wash-fold' },
  { id: 'towel', name: 'Towel', price: 100, category: 'wash-fold' },
  
  // Dry Cleaning
  { id: 'suit', name: 'Suit', price: 800, category: 'dry-cleaning' },
  { id: 'coat', name: 'Coat', price: 600, category: 'dry-cleaning' },
  { id: 'blazer', name: 'Blazer', price: 500, category: 'dry-cleaning' },
  { id: 'silk-dress', name: 'Silk Dress', price: 700, category: 'dry-cleaning' },
  { id: 'tie', name: 'Tie', price: 150, category: 'dry-cleaning' },
  
  // Ironing
  { id: 'shirt-iron', name: 'Shirt (Iron)', price: 80, category: 'ironing' },
  { id: 'trouser-iron', name: 'Trouser (Iron)', price: 100, category: 'ironing' },
  { id: 'dress-iron', name: 'Dress (Iron)', price: 120, category: 'ironing' },
  { id: 'bedsheet-iron', name: 'Bed Sheet (Iron)', price: 150, category: 'ironing' },
  
  // Shoe Cleaning
  { id: 'leather-shoes', name: 'Leather Shoes', price: 300, category: 'shoe-cleaning' },
  { id: 'sneakers', name: 'Sneakers', price: 250, category: 'shoe-cleaning' },
  { id: 'boots', name: 'Boots', price: 400, category: 'shoe-cleaning' },
  { id: 'sandals', name: 'Sandals', price: 200, category: 'shoe-cleaning' },
];

// Pay-per-bag services adapted for Kenya
const bagServices: BagService[] = [
  // Casuals - Wash & Fold
  { id: 'casuals-bag', name: 'Casuals Bag', description: 'Everyday clothes - wash & fold service', price: 800, category: 'wash-fold' },
  
  // Delicates - Clean & Press
  { id: 'delicates-bag', name: 'Delicates Bag', description: 'Smart wear - clean & press service', price: 1200, category: 'dry-cleaning' },
  
  // Home Linens
  { id: 'home-bag', name: 'Home Linens Bag', description: 'Bedding & towels - wash & fold service', price: 1000, category: 'wash-fold' },
  
  // Press Only
  { id: 'press-bag', name: 'Press Only Bag', description: 'Clean items that need pressing only', price: 600, category: 'ironing' },
  
  // Kids Uniforms
  { id: 'kids-uniforms-bag', name: 'Kids Uniforms Bag', description: 'School uniforms - wash & press service', price: 700, category: 'wash-fold' },
];

import washFoldImg from '../../assets/images/wash-fold.jpg';
import dryCleaningImg from '../../assets/images/dry cleaning.jpg';
import ironingImg from '../../assets/images/ironing.jpg';
import shoeCleaningImg from '../../assets/images/shoe cleaning.jpg';

const serviceCategories = [
  { id: 'wash-fold', name: 'Wash & Fold', image: washFoldImg },
  { id: 'dry-cleaning', name: 'Dry Cleaning', image: dryCleaningImg },
  { id: 'ironing', name: 'Ironing', image: ironingImg },
  { id: 'shoe-cleaning', name: 'Shoe Cleaning', image: shoeCleaningImg },
];

export default function BookServiceScreen() {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const { user } = useAuth();
  const { createOrder: createOrderContext } = useOrders();
  
  const [orderType, setOrderType] = useState<'per-item' | 'per-bag'>('per-item');
  const [selectedCategory, setSelectedCategory] = useState<string>('wash-fold');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bagCart, setBagCart] = useState<BagCartItem[]>([]);
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [orderStep, setOrderStep] = useState<'cart' | 'payment' | 'processing' | 'confirmed'>('cart');

  const addToCart = (service: ServiceItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === service.id);
      if (existing) {
        return prev.map(item =>
          item.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...service, quantity: 1 }];
    });
  };

  const removeFromCart = (serviceId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === serviceId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.id === serviceId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.id !== serviceId);
    });
  };

  const addBagToCart = (bagService: BagService) => {
    setBagCart(prev => {
      const existing = prev.find(item => item.id === bagService.id);
      if (existing) {
        return prev.map(item =>
          item.id === bagService.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...bagService, quantity: 1 }];
    });
  };

  const removeBagFromCart = (serviceId: string) => {
    setBagCart(prev => {
      const existing = prev.find(item => item.id === serviceId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.id === serviceId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.id !== serviceId);
    });
  };

  const getCartTotal = () => {
    if (orderType === 'per-item') {
      return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    } else {
      return bagCart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
  };

  const getCartItemCount = () => {
    if (orderType === 'per-item') {
      return cart.reduce((total, item) => total + item.quantity, 0);
    } else {
      return bagCart.reduce((total, item) => total + item.quantity, 0);
    }
  };

  const handleCheckout = () => {
    if ((orderType === 'per-item' && cart.length === 0) || (orderType === 'per-bag' && bagCart.length === 0)) {
      Alert.alert('Empty Cart', 'Please add items to your cart before proceeding.');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Missing Address', 'Please enter your delivery address.');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Missing Phone Number', 'Please enter your phone number.');
      return;
    }

    setOrderStep('payment');
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (paymentMethod: string, paymentDetails?: any) => {
    setOrderStep('processing');
    setShowPaymentModal(false);

    try {
      // Create order data
      const orderData = {
        category: selectedCategory,
        date: new Date().toISOString().split('T')[0],
        address: address.trim(),
        status: 'pending' as const,
        items: orderType === 'per-item' 
          ? cart.map(item => `${item.name} (${item.quantity})`)
          : bagCart.map(item => `${item.name} (${item.quantity})`),
        total: getCartTotal(),
        pickupTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        notes: `Order Type: ${orderType}, Phone: ${phoneNumber}, Payment: ${paymentMethod}`,
      };

      // Create order in database
      const orderId = await createOrderContext(orderData);

      // Create detailed order object for modals
      const detailedOrder = {
        id: orderId,
        service: selectedCategory.replace('-', ' ').toUpperCase(),
        items: orderType === 'per-item' 
          ? cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price }))
          : bagCart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
        total: getCartTotal(),
        area: address.trim(),
        phone: phoneNumber,
        pickupTime: 'Tomorrow, 9:00 AM - 5:00 PM',
        paymentMethod,
        status: 'pending',
        isPaid: paymentMethod !== 'cash',
        orderType,
        createdAt: new Date().toISOString(),
      };

      setCurrentOrder(detailedOrder);
      
      // Send confirmation notification
      await notificationService.sendLocalNotification({
        orderId,
        type: 'order_assigned',
        title: '🎉 Order Confirmed!',
        body: `Your ${selectedCategory.replace('-', ' ')} order has been confirmed. We'll pickup your items tomorrow.`,
      });

      // Clear cart and form
      if (orderType === 'per-item') {
        setCart([]);
      } else {
        setBagCart([]);
      }
      setAddress('');
      setPhoneNumber('');
      
      setOrderStep('confirmed');
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert(
        'Order Failed', 
        'There was an error creating your order. Please try again.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              setOrderStep('payment');
              setShowPaymentModal(true);
            }
          }
        ]
      );
    }
  };

  const handleOrderSuccess = () => {
    setShowSuccessModal(false);
    setOrderStep('cart');
    // Navigate to tracking screen
    Alert.alert(
      'Track Your Order',
      'Would you like to track your order now?',
      [
        { text: 'Later', style: 'cancel' },
        { 
          text: 'Track Now', 
          onPress: () => {
            // Navigate to track screen with order ID
            // router.push(`/(tabs)/track?orderId=${currentOrder?.id}`);
          }
        }
      ]
    );
  };

  const handleViewReceipt = () => {
    setShowSuccessModal(false);
    setShowReceiptModal(true);
  };

  const handleCloseReceipt = () => {
    setShowReceiptModal(false);
    setOrderStep('cart');
  };

  const filteredServices = services.filter(service => service.category === selectedCategory);
  const filteredBagServices = bagServices.filter(service => service.category === selectedCategory);

  const getItemQuantity = (itemId: string) => {
    if (orderType === 'per-item') {
      return cart.find(item => item.id === itemId)?.quantity || 0;
    } else {
      return bagCart.find(item => item.id === itemId)?.quantity || 0;
    }
  };

  const showBagInfo = () => {
    Alert.alert(
      'Pay-per-Bag Service',
      'Our pay-per-bag service is perfect for bulk laundry. Each bag can hold approximately 8-12 items depending on the type of clothing. This option offers great value for families or those with larger laundry loads.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.primary} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Premium Header */}
          <LinearGradient
            colors={[colors.primary, colors.primary + 'F0', colors.primary + 'E6', colors.primary + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerTop}>
                <View style={styles.titleSection}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title}>Book Service</Text>
                  </View>
                  <Text style={styles.subtitle}>
                    Choose your preferred laundry service
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Order Type Selection */}
          <View style={styles.orderTypeSection}>
            <View style={styles.orderTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.orderTypeCard,
                  orderType === 'per-item' && styles.orderTypeCardSelected
                ]}
                onPress={() => setOrderType('per-item')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={orderType === 'per-item' 
                    ? [colors.primary, colors.primary + 'E6'] 
                    : [colors.card, colors.card + 'F0']
                  }
                  style={styles.orderTypeGradient}
                />
                <View style={styles.orderTypeContent}>
                  <View style={[
                    styles.orderTypeIcon,
                    { backgroundColor: orderType === 'per-item' ? 'rgba(255,255,255,0.2)' : colors.primary + '20' }
                  ]}>
                    <Package2 
                      size={28} 
                      color={orderType === 'per-item' ? '#FFFFFF' : colors.primary} 
                    />
                  </View>
                  <Text style={[
                    styles.orderTypeTitle,
                    { color: orderType === 'per-item' ? '#FFFFFF' : colors.text }
                  ]}>
                    Per Item
                  </Text>
                  <Text style={[
                    styles.orderTypeDescription,
                    { color: orderType === 'per-item' ? 'rgba(255,255,255,0.9)' : colors.textSecondary }
                  ]}>
                    Pay for individual items with precise pricing
                  </Text>
                  {orderType === 'per-item' && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>SELECTED</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.orderTypeCard,
                  orderType === 'per-bag' && styles.orderTypeCardSelected
                ]}
                onPress={() => setOrderType('per-bag')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={orderType === 'per-bag' 
                    ? [colors.primary, colors.primary + 'E6'] 
                    : [colors.card, colors.card + 'F0']
                  }
                  style={styles.orderTypeGradient}
                />
                <View style={styles.orderTypeContent}>
                  <View style={[
                    styles.orderTypeIcon,
                    { backgroundColor: orderType === 'per-bag' ? 'rgba(255,255,255,0.2)' : colors.primary + '20' }
                  ]}>
                    <ShoppingCart 
                      size={28} 
                      color={orderType === 'per-bag' ? '#FFFFFF' : colors.primary} 
                    />
                  </View>
                  <Text style={[
                    styles.orderTypeTitle,
                    { color: orderType === 'per-bag' ? '#FFFFFF' : colors.text }
                  ]}>
                    Per Bag
                  </Text>
                  <Text style={[
                    styles.orderTypeDescription,
                    { color: orderType === 'per-bag' ? 'rgba(255,255,255,0.9)' : colors.textSecondary }
                  ]}>
                    Great value for bulk laundry loads
                  </Text>
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>POPULAR</Text>
                  </View>
                  {orderType === 'per-bag' && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>SELECTED</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Service Categories */}
          <View style={styles.categoriesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Service Categories
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={styles.categoriesContent}
            >
              {serviceCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    selectedCategory === category.id && styles.categoryCardSelected,
                    { backgroundColor: colors.card }
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                  activeOpacity={0.8}
                >
                  {selectedCategory === category.id && (
                    <LinearGradient
                      colors={[colors.primary + '20', colors.primary + '10']}
                      style={styles.categoryGradient}
                    />
                  )}
                  <View style={[
                    styles.categoryIconContainer,
                    { backgroundColor: selectedCategory === category.id ? colors.primary : colors.background }
                  ]}>
                    <Image source={category.image} style={styles.categoryImage} />
                  </View>
                  <Text style={[
                    styles.categoryName,
                    { 
                      color: selectedCategory === category.id ? colors.primary : colors.text,
                      fontWeight: selectedCategory === category.id ? '700' : '600'
                    }
                  ]}>
                    {category.name}
                  </Text>
                  {selectedCategory === category.id && (
                    <View style={styles.selectedIndicator}>
                      <View style={styles.selectedDot} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Services List */}
          <View style={styles.servicesSection}>
            {orderType === 'per-bag' ? (
              <>
                <View style={styles.bagServicesHeader}>
                  <Text style={[styles.servicesSectionTitle, { color: colors.text }]}>
                    Bag Services
                  </Text>
                  <TouchableOpacity
                    style={[styles.infoButton, { backgroundColor: colors.primary + '20' }]}
                    onPress={showBagInfo}
                  >
                    <Info size={14} color={colors.primary} />
                    <Text style={[styles.infoButtonText, { color: colors.primary }]}>
                      Info
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.bagServicesSubtitle, { color: colors.textSecondary }]}>
                  Each bag can hold 8-12 items. Perfect for bulk laundry with great value pricing.
                </Text>
                {filteredBagServices.map((service) => {
                  const quantity = getItemQuantity(service.id);
                  return (
                    <View
                      key={service.id}
                      style={[
                        styles.bagServiceItem,
                        { backgroundColor: colors.card },
                        quantity > 0 && styles.serviceItemSelected
                      ]}
                    >
                      <View style={styles.bagServiceContent}>
                        <View style={styles.bagServiceInfo}>
                          <View style={styles.bagServiceHeader}>
                            <Text style={[styles.bagServiceName, { color: colors.text }]}>
                              {service.name}
                            </Text>
                            <View style={[styles.bagServiceBadge, { backgroundColor: colors.primary + '20' }]}>
                              <Sparkles size={12} color={colors.primary} />
                              <Text style={[styles.bagServiceBadgeText, { color: colors.primary }]}>
                                BULK
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.bagServiceDescription, { color: colors.textSecondary }]}>
                            {service.description}
                          </Text>
                          <Text style={[styles.bagServicePrice, { color: colors.primary }]}>
                            KSh {service.price.toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.quantityControls}>
                          {quantity > 0 && (
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() => removeBagFromCart(service.id)}
                            >
                              <LinearGradient
                                colors={['#FF6B6B', '#FF5252']}
                                style={styles.quantityButton}
                              >
                                <Minus size={20} color="#FFFFFF" />
                              </LinearGradient>
                            </TouchableOpacity>
                          )}
                          {quantity > 0 && (
                            <View style={[styles.quantityDisplay, { backgroundColor: colors.primary + '20' }]}>
                              <Text style={[styles.quantityText, { color: colors.primary }]}>
                                {quantity}
                              </Text>
                            </View>
                          )}
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => addBagToCart(service)}
                          >
                            <LinearGradient
                              colors={['#51CF66', '#40C057']}
                              style={styles.quantityButton}
                            >
                              <Plus size={20} color="#FFFFFF" />
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {quantity > 0 && (
                        <View style={[styles.inCartBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.inCartText}>IN CART</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            ) : (
              <>
                <Text style={[styles.servicesSectionTitle, { color: colors.text }]}>
                  {serviceCategories.find(cat => cat.id === selectedCategory)?.name} Services
                </Text>
                {filteredServices.map((service) => {
                  const quantity = getItemQuantity(service.id);
                  return (
                    <View
                      key={service.id}
                      style={[
                        styles.serviceItem,
                        { backgroundColor: colors.card },
                        quantity > 0 && styles.serviceItemSelected
                      ]}
                    >
                      <View style={styles.serviceContent}>
                        <View style={styles.serviceInfo}>
                          <Text style={[styles.serviceName, { color: colors.text }]}>
                            {service.name}
                          </Text>
                          <Text style={[styles.servicePrice, { color: colors.primary }]}>
                            KSh {service.price.toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.quantityControls}>
                          {quantity > 0 && (
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() => removeFromCart(service.id)}
                            >
                              <LinearGradient
                                colors={['#FF6B6B', '#FF5252']}
                                style={styles.quantityButton}
                              >
                                <Minus size={20} color="#FFFFFF" />
                              </LinearGradient>
                            </TouchableOpacity>
                          )}
                          {quantity > 0 && (
                            <View style={[styles.quantityDisplay, { backgroundColor: colors.primary + '20' }]}>
                              <Text style={[styles.quantityText, { color: colors.primary }]}>
                                {quantity}
                              </Text>
                            </View>
                          )}
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => addToCart(service)}
                          >
                            <LinearGradient
                              colors={['#51CF66', '#40C057']}
                              style={styles.quantityButton}
                            >
                              <Plus size={20} color="#FFFFFF" />
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {quantity > 0 && (
                        <View style={[styles.inCartBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.inCartText}>IN CART</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            )}
          </View>

          {/* Cart Summary */}
          {getCartItemCount() > 0 && (
            <View style={styles.cartSection}>
              <LinearGradient
                colors={[colors.card, colors.card + 'F0']}
                style={styles.cartGradient}
              >
                <View style={[styles.cartSummary, { backgroundColor: 'transparent' }]}>
                  <View style={styles.cartHeader}>
                    <View style={[styles.cartIconContainer, { backgroundColor: colors.primary + '20' }]}>
                      <ShoppingCart size={24} color={colors.primary} />
                    </View>
                    <View style={styles.cartHeaderText}>
                      <Text style={[styles.cartTitle, { color: colors.text }]}>
                        Your Cart
                      </Text>
                      <Text style={[styles.cartSubtitle, { color: colors.textSecondary }]}>
                        {getCartItemCount()} {getCartItemCount() === 1 ? 'item' : 'items'} selected
                      </Text>
                    </View>
                    <View style={[styles.cartBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.cartBadgeText}>
                        {getCartItemCount()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cartItems}>
                    {orderType === 'per-item' ? (
                      cart.map((item) => (
                        <View key={item.id} style={[styles.cartItem, { borderBottomColor: colors.border }]}>
                          <View style={styles.cartItemInfo}>
                            <Text style={[styles.cartItemName, { color: colors.text }]}>
                              {item.name}
                            </Text>
                            <Text style={[styles.cartItemDetails, { color: colors.textSecondary }]}>
                              {item.quantity} × KSh {item.price.toLocaleString()}
                            </Text>
                          </View>
                          <Text style={[styles.cartItemPrice, { color: colors.primary }]}>
                            KSh {(item.price * item.quantity).toLocaleString()}
                          </Text>
                        </View>
                      ))
                    ) : (
                      bagCart.map((item) => (
                        <View key={item.id} style={[styles.cartItem, { borderBottomColor: colors.border }]}>
                          <View style={styles.cartItemInfo}>
                            <Text style={[styles.cartItemName, { color: colors.text }]}>
                              {item.name}
                            </Text>
                            <Text style={[styles.cartItemDetails, { color: colors.textSecondary }]}>
                              {item.quantity} × KSh {item.price.toLocaleString()}
                            </Text>
                          </View>
                          <Text style={[styles.cartItemPrice, { color: colors.primary }]}>
                            KSh {(item.price * item.quantity).toLocaleString()}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>

                  <View style={[styles.cartTotal, { borderTopColor: colors.border }]}>
                    <Text style={[styles.totalLabel, { color: colors.text }]}>
                      Total
                    </Text>
                    <Text style={[styles.totalAmount, { color: colors.primary }]}>
                      KSh {getCartTotal().toLocaleString()}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Delivery Information */}
          {getCartItemCount() > 0 && (
            <View style={styles.deliverySection}>
              <Text style={[styles.deliverySectionTitle, { color: colors.text }]}>
                Delivery Information
              </Text>
              <View style={[styles.deliveryCard, { backgroundColor: colors.card }]}>
                <View style={styles.inputGroup}>
                  <View style={[styles.inputIconContainer, { backgroundColor: colors.primary + '20' }]}>
                    <MapPin size={24} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                    placeholder="Enter your delivery address"
                    placeholderTextColor={colors.textSecondary}
                    value={address}
                    onChangeText={setAddress}
                    multiline
                  />
                </View>
                <View style={styles.inputGroup}>
                  <View style={[styles.inputIconContainer, { backgroundColor: colors.primary + '20' }]}>
                    <Phone size={24} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                    placeholder="Enter your phone number"
                    placeholderTextColor={colors.textSecondary}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Checkout Button */}
          {getCartItemCount() > 0 && (
            <View style={styles.checkoutSection}>
              <TouchableOpacity
                style={styles.checkoutGradient}
                onPress={handleCheckout}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primary + 'E6']}
                  style={styles.checkoutGradient}
                >
                  <View style={styles.checkoutButton}>
                    <ShoppingCart size={24} color="#FFFFFF" />
                    <Text style={styles.checkoutButtonText}>
                      Proceed to Payment • KSh {getCartTotal().toLocaleString()}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentComplete={handlePaymentComplete}
        total={getCartTotal()}
      />

      {/* Success Modal */}
      {currentOrder && (
        <OrderConfirmationModal
          visible={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          onViewReceipt={() => {
            setShowSuccessModal(false);
            setShowReceiptModal(true);
          }}
          orderDetails={currentOrder}
        />
      )}

      {/* Receipt Modal */}
      {currentOrder && (
        <ReceiptModal
          visible={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          orderDetails={currentOrder}
        />
      )}

      {/* WhatsApp Support Button */}
      <WhatsAppButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTop: {
    width: '100%',
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  orderTypeSection: {
    marginBottom: 32,
  },
  orderTypeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  orderTypeCard: {
    flex: 1,
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  orderTypeCardSelected: {
    shadowColor: Colors.light.primary,
    shadowOpacity: 0.3,
    elevation: 12,
  },
  orderTypeGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  orderTypeContent: {
    padding: 24,
    alignItems: 'center',
    minHeight: 160,
  },
  orderTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  orderTypeTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  orderTypeDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  categoriesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  categoriesContainer: {
    paddingLeft: 20,
  },
  categoriesContent: {
    paddingRight: 20,
    gap: 16,
  },
  categoryCard: {
    position: 'relative',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    minWidth: 140,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    backgroundColor: '#FFFFFF',
  },
  categoryCardSelected: {
    shadowColor: Colors.light.primary,
    shadowOpacity: 0.3,
    elevation: 12,
  },
  categoryGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryImage: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  categoryName: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  servicesSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  servicesSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  bagServicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  infoButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bagServicesSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  bagServiceItem: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  bagServiceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  bagServiceInfo: {
    flex: 1,
    marginRight: 16,
  },
  bagServiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bagServiceName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  bagServiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  bagServiceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  bagServiceDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  bagServicePrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  serviceItem: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  serviceItemSelected: {
    shadowColor: Colors.light.primary,
    shadowOpacity: 0.2,
    elevation: 8,
  },
  serviceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  removeButton: {
    backgroundColor: '#FF6B6B',
  },
  addButton: {
    backgroundColor: '#51CF66',
  },
  quantityDisplay: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 50,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  inCartBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inCartText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  cartSection: {
    marginBottom: 32,
  },
  cartGradient: {
    paddingHorizontal: 20,
  },
  cartSummary: {
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cartIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cartHeaderText: {
    flex: 1,
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  cartSubtitle: {
    fontSize: 14,
  },
  cartBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cartItems: {
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cartItemDetails: {
    fontSize: 12,
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  cartTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    marginTop: 16,
    borderTopWidth: 2,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  deliverySection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  deliverySectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  deliveryCard: {
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  input: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  checkoutSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  checkoutGradient: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
    gap: 12,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

// declare module '*.png' {
//   const value: any;
//   export default value;
// }