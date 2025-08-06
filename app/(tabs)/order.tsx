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
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleProp,
} from 'react-native';

// Helper functions to handle type assertions
const asViewStyle = (style: any): StyleProp<ViewStyle> => style as StyleProp<ViewStyle>;
const asTextStyle = (style: any): StyleProp<TextStyle> => style as StyleProp<TextStyle>;
const asImageStyle = (style: any): StyleProp<ImageStyle> => style as StyleProp<ImageStyle>;
const asArrayViewStyle = (styles: any[]): StyleProp<ViewStyle>[] => styles as StyleProp<ViewStyle>[];
const asArrayTextStyle = (styles: any[]): StyleProp<TextStyle>[] => styles as StyleProp<TextStyle>[];
const asArrayImageStyle = (styles: any[]): StyleProp<ImageStyle>[] => styles as StyleProp<ImageStyle>[];
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
  
  // Specialized Care
  { id: 'curtains', name: 'Curtains', price: 500, category: 'specialized-care' },
  { id: 'leather-jacket', name: 'Leather Jacket', price: 900, category: 'specialized-care' },
  { id: 'handbag', name: 'Designer Handbag', price: 400, category: 'specialized-care' },
  { id: 'wedding-dress', name: 'Wedding Dress', price: 1200, category: 'specialized-care' },
  { id: 'carpet', name: 'Small Carpet/Rug', price: 800, category: 'specialized-care' },
];

// Pay-per-bag services adapted for Kenya
const bagServices: BagService[] = [
  // Casuals - Wash & Fold
  { id: 'casuals-bag', name: 'Everyday Essentials', description: 'Daily wear that requires washing & folding - t-shirts, jeans, casual dresses', price: 800, category: 'wash-fold' },
  
  // Delicates - Clean & Press
  { id: 'delicates-bag', name: 'Professional Wardrobe', description: 'Smart wear & office attire - shirts, blouses, smart dresses with cleaning & pressing', price: 1200, category: 'dry-cleaning' },
  
  // Home Linens
  { id: 'home-bag', name: 'Home Comfort Pack', description: 'Household fabrics - bedding, towels, tablecloths with wash & fold service', price: 1000, category: 'wash-fold' },
  
  // Press Only
  { id: 'press-bag', name: 'Fresh Press Service', description: 'Clean garments that only need professional pressing & hanging', price: 600, category: 'ironing' },
  
  // Kids Uniforms
  { id: 'kids-uniforms-bag', name: 'School Ready Pack', description: 'School uniforms & sportswear - complete wash, press & starch service', price: 700, category: 'wash-fold' },
  
  // New Specialized Service
  { id: 'specialty-bag', name: 'Premium Care Collection', description: 'Delicate items (4-6 pieces) - curtains, leather accessories, designer wear requiring special attention', price: 1500, category: 'specialized-care' },
];

const washFoldImg = require('../../assets/images/wash-fold.jpg');
const dryCleaningImg = require('../../assets/images/dry cleaning.jpg');
const ironingImg = require('../../assets/images/ironing.jpg');
const shoeCleaningImg = require('../../assets/images/shoe cleaning.jpg');
const premiumCareImg = require('../../assets/images/premium-care.jpg'); // Using the steaming/ironing image for premium care

const serviceCategories = [
  { 
    id: 'wash-fold', 
    name: 'Wash & Fold', 
    image: washFoldImg,
    description: 'Daily wear that require washing & folding',
    isPopular: true
  },
  { 
    id: 'dry-cleaning', 
    name: 'Clean & Press', 
    image: dryCleaningImg,
    description: 'Clothing that require cleaning, pressing & hanging',
    isPopular: true
  },
  { 
    id: 'ironing', 
    name: 'Press Only', 
    image: ironingImg,
    description: 'Clean fabrics that only require pressing & hanging',
    isPopular: false
  },
  { 
    id: 'shoe-cleaning', 
    name: 'Shoes', 
    image: shoeCleaningImg,
    description: 'Cleaning services for shoes of all types & colors',
    isPopular: false
  },
  { 
    id: 'specialized-care', 
    name: 'Premium Care', 
    image: premiumCareImg,
    description: 'Special items requiring expert care & attention',
    isPopular: true
  },
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
        title: '  Order Confirmed!',
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
      'Premium Bag Services',
      'Our specialized bag services offer exceptional value for families and busy professionals. Different bag types accommodate various item counts:\n\n• Standard Services: 12-20 items\n• Premium Care: 4-6 specialty items\n\nPerfect for:\n• Bulk family laundry\n• Weekly wardrobe refresh\n• Seasonal clothing care\n• Professional garment maintenance\n• Delicate & designer items\n\nAll items are sorted, treated, and finished to our premium standards.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  return (
    <SafeAreaView style={asArrayViewStyle([styles.container, { backgroundColor: colors.background }])}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.primary} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={asViewStyle(styles.keyboardView)}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={asViewStyle(styles.scrollContent)}
        >
          {/* Premium Header */}
          <LinearGradient
            colors={[colors.primary, colors.primary + 'F0', colors.primary + 'E6', colors.primary + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={asViewStyle(styles.headerGradient)}
          >
            <View style={asViewStyle(styles.headerContent)}>
              <View style={asViewStyle(styles.headerTop)}>
                <View style={asViewStyle(styles.titleSection)}>
                  <View style={asViewStyle(styles.titleRow)}>
                    <Text style={styles.title as TextStyle}>Book Service</Text>
                  </View>
                  <Text style={asTextStyle(styles.subtitle)}>
                    Choose your preferred laundry service
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Order Type Selection */}
          <View style={asViewStyle(styles.orderTypeSection)}>
            <View style={asViewStyle(styles.orderTypeContainer)}>
              <TouchableOpacity
                style={[
                  asViewStyle(styles.orderTypeCard),
                  orderType === 'per-item' ? asViewStyle(styles.orderTypeCardSelected) : undefined
                ]}
                onPress={() => setOrderType('per-item')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={orderType === 'per-item' 
                    ? [colors.primary, colors.primary + 'E6'] 
                    : [colors.card, colors.card + 'F0']
                  }
                  style={asViewStyle(styles.orderTypeGradient)}
                />
                <View style={asViewStyle(styles.orderTypeContent)}>
                  <View style={[
                    asViewStyle(styles.orderTypeIcon),
                    { backgroundColor: orderType === 'per-item' ? 'rgba(255,255,255,0.2)' : colors.primary + '20' }
                  ]}>
                    <Package2 
                      size={28} 
                      color={orderType === 'per-item' ? '#FFFFFF' : colors.primary} 
                    />
                  </View>
                  <Text style={[
                    asTextStyle(styles.orderTypeTitle),
                    { color: orderType === 'per-item' ? '#FFFFFF' : colors.text }
                  ]}>
                    Per Item
                  </Text>
                  <Text style={[
                    asTextStyle(styles.orderTypeDescription),
                    { color: orderType === 'per-item' ? 'rgba(255,255,255,0.9)' : colors.textSecondary }
                  ]}>
                    Pay for individual items with precise pricing
                  </Text>
                  {orderType === 'per-item' && (
                    <View style={asViewStyle(styles.popularBadge)}>
                      <Text style={asTextStyle(styles.popularText)}>SELECTED</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  asViewStyle(styles.orderTypeCard),
                  orderType === 'per-bag' && asViewStyle(styles.orderTypeCardSelected)
                ]}
                onPress={() => setOrderType('per-bag')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={orderType === 'per-bag' 
                    ? [colors.primary, colors.primary + 'E6'] 
                    : [colors.card, colors.card + 'F0']
                  }
                  style={asViewStyle(styles.orderTypeGradient)}
                />
                <View style={asViewStyle(styles.orderTypeContent)}>
                  <View style={[
                    asViewStyle(styles.orderTypeIcon),
                    { backgroundColor: orderType === 'per-bag' ? 'rgba(255,255,255,0.2)' : colors.primary + '20' }
                  ]}>
                    <ShoppingCart 
                      size={28} 
                      color={orderType === 'per-bag' ? '#FFFFFF' : colors.primary} 
                    />
                  </View>
                  <Text style={[
                    asTextStyle(styles.orderTypeTitle),
                    { color: orderType === 'per-bag' ? '#FFFFFF' : colors.text }
                  ]}>
                    Per Bag
                  </Text>
                  <Text style={[
                    asTextStyle(styles.orderTypeDescription),
                    { color: orderType === 'per-bag' ? 'rgba(255,255,255,0.9)' : colors.textSecondary }
                  ]}>
                    Great value for bulk laundry loads
                  </Text>
                  {orderType !== 'per-bag' && (
                    <View style={asViewStyle(styles.popularBadge)}>
                      <Text style={asTextStyle(styles.popularText)}>POPULAR</Text>
                    </View>
                  )}
                  {orderType === 'per-bag' && (
                    <View style={[asViewStyle(styles.selectedBadge), { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                      <Text style={asTextStyle(styles.selectedText)}>SELECTED</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Service Categories */}
          <View style={asViewStyle(styles.categoriesSection)}>
            <Text style={asArrayTextStyle([styles.sectionTitle, { color: colors.text }])}>
              Service Categories
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={asViewStyle(styles.categoriesContainer)}
              contentContainerStyle={asViewStyle(styles.categoriesContent)}
            >
              {serviceCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    asViewStyle(styles.categoryCard),
                    selectedCategory === category.id && asViewStyle(styles.categoryCardSelected),
                    { backgroundColor: colors.card }
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                  activeOpacity={0.6}
                >
                  {selectedCategory === category.id && (
                    <LinearGradient
                      colors={[colors.primary + '30', colors.primary + '15', colors.primary + '05']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={asViewStyle(styles.categoryGradient)}
                    />
                  )}
                  <View style={[
                    asViewStyle(styles.categoryIconContainer),
                    { backgroundColor: selectedCategory === category.id ? colors.primary : colors.background }
                  ]}>
                    <Image source={category.image} style={asImageStyle(styles.categoryImage)} />
                  </View>
                  <Text style={[
                    asTextStyle(styles.categoryName),
                    { 
                      color: selectedCategory === category.id ? colors.primary : colors.text,
                      fontWeight: selectedCategory === category.id ? '700' : '600'
                    }
                  ]}>
                    {category.name}
                  </Text>
                  <Text style={[
                    asTextStyle(styles.categoryDescription),
                    { 
                      color: selectedCategory === category.id ? colors.primary + 'CC' : colors.textSecondary,
                    }
                  ]}>
                    {category.description}
                  </Text>
                  {selectedCategory === category.id && (
                    <View style={asViewStyle(styles.selectedIndicator)}>
                      <View style={asViewStyle(styles.selectedDot)} />
                    </View>
                  )}
                  {category.isPopular && selectedCategory !== category.id && (
                    <View style={asViewStyle(styles.popularBadge)}>
                      <Text style={asTextStyle(styles.popularText)}>POPULAR</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Services List */}
          <View style={asViewStyle(styles.servicesSection)}>
            {orderType === 'per-bag' ? (
              <>
                <View style={asViewStyle(styles.bagServicesHeader)}>
                  <Text style={asArrayTextStyle([styles.servicesSectionTitle, { color: colors.text }])}>
                    Bag Services
                  </Text>
                  <TouchableOpacity
                    style={asArrayViewStyle([styles.infoButton, { backgroundColor: colors.primary + '20' }])}
                    onPress={showBagInfo}
                  >
                    <Info size={14} color={colors.primary} />
                    <Text style={asArrayTextStyle([styles.infoButtonText, { color: colors.primary }])}>
                      Info
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={asArrayTextStyle([styles.bagServicesSubtitle, { color: colors.textSecondary }])}>
                  Premium bag services with expert care. Standard bags hold 12-20 items, Premium Care holds 4-6 specialty items.
                </Text>
                {filteredBagServices.map((service) => {
                  const quantity = getItemQuantity(service.id);
                  return (
                    <View
                      key={service.id}
                      style={[
                        asViewStyle(styles.bagServiceItem),
                        { backgroundColor: colors.card },
                        quantity > 0 && asViewStyle(asViewStyle(styles.serviceItemSelected))
                      ]}
                    >
                      <View style={asViewStyle(styles.bagServiceContent)}>
                        <View style={asViewStyle(styles.bagServiceInfo)}>
                          <View style={asViewStyle(styles.bagServiceHeader)}>
                            <Text style={asArrayTextStyle([styles.bagServiceName, { color: colors.text }])}>
                              {service.name}
                            </Text>
                            <View style={asArrayViewStyle([styles.bagServiceBadge, { backgroundColor: colors.primary + '20' }])}>
                              <Sparkles size={12} color={colors.primary} />
                              <Text style={asArrayTextStyle([styles.bagServiceBadgeText, { color: colors.primary }])}>
                                BULK
                              </Text>
                            </View>
                          </View>
                          <Text style={asArrayTextStyle([styles.bagServiceDescription, { color: colors.textSecondary }])}>
                            {service.description}
                          </Text>
                          <Text style={asArrayTextStyle([styles.bagServicePrice, { color: colors.primary }])}>
                            KSh {(service.price || 0).toLocaleString()}
                          </Text>
                        </View>
                        <View style={asViewStyle(styles.quantityControls)}>
                          {quantity > 0 && (
                            <TouchableOpacity
                              style={asViewStyle(styles.quantityButton)}
                              onPress={() => removeBagFromCart(service.id)}
                            >
                              <LinearGradient
                                colors={['#FF6B6B', '#FF5252']}
                                style={asViewStyle(styles.quantityButton)}
                              >
                                <Minus size={20} color="#FFFFFF" />
                              </LinearGradient>
                            </TouchableOpacity>
                          )}
                          {quantity > 0 && (
                            <View style={[asViewStyle(styles.quantityDisplay), { backgroundColor: colors.primary + '20' }]}>
                              <Text style={asArrayTextStyle([styles.quantityText, { color: colors.primary }])}>
                                {quantity}
                              </Text>
                            </View>
                          )}
                          <TouchableOpacity
                            style={asViewStyle(styles.quantityButton)}
                            onPress={() => addBagToCart(service)}
                          >
                            <LinearGradient
                              colors={['#51CF66', '#40C057']}
                              style={asViewStyle(styles.quantityButton)}
                            >
                              <Plus size={20} color="#FFFFFF" />
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {quantity > 0 && (
                        <View style={[asViewStyle(styles.inCartBadge), { backgroundColor: colors.primary }]}>
                          <Text style={asTextStyle(styles.inCartText)}>IN CART</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            ) : (
              <>
                <Text style={asArrayTextStyle([styles.servicesSectionTitle, { color: colors.text }])}>
                  {serviceCategories.find(cat => cat.id === selectedCategory)?.name} Services
                </Text>
                {filteredServices.map((service) => {
                  const quantity = getItemQuantity(service.id);
                  return (
                    <View
                      key={service.id}
                      style={[
                        asViewStyle(styles.serviceItem),
                        { backgroundColor: colors.card },
                        quantity > 0 && asViewStyle(styles.serviceItemSelected)
                      ]}
                    >
                      <View style={asViewStyle(styles.serviceContent)}>
                        <View style={asViewStyle(styles.serviceInfo)}>
                          <Text style={asArrayTextStyle([styles.serviceName, { color: colors.text }])}>
                            {service.name}
                          </Text>
                          <Text style={asArrayTextStyle([styles.servicePrice, { color: colors.primary }])}>
                            KSh {(service.price || 0).toLocaleString()}
                          </Text>
                        </View>
                        <View style={asViewStyle(styles.quantityControls)}>
                          {quantity > 0 && (
                            <TouchableOpacity
                              style={asViewStyle(styles.quantityButton)}
                              onPress={() => removeFromCart(service.id)}
                            >
                              <LinearGradient
                                colors={['#FF6B6B', '#FF5252']}
                                style={asViewStyle(styles.quantityButton)}
                              >
                                <Minus size={20} color="#FFFFFF" />
                              </LinearGradient>
                            </TouchableOpacity>
                          )}
                          {quantity > 0 && (
                            <View style={[asViewStyle(styles.quantityDisplay), { backgroundColor: colors.primary + '20' }]}>
                              <Text style={asArrayTextStyle([styles.quantityText, { color: colors.primary }])}>
                                {quantity}
                              </Text>
                            </View>
                          )}
                          <TouchableOpacity
                            style={asViewStyle(styles.quantityButton)}
                            onPress={() => addToCart(service)}
                          >
                            <LinearGradient
                              colors={['#51CF66', '#40C057']}
                              style={asViewStyle(styles.quantityButton)}
                            >
                              <Plus size={20} color="#FFFFFF" />
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {quantity > 0 && (
                        <View style={[asViewStyle(styles.inCartBadge), { backgroundColor: colors.primary }]}>
                          <Text style={asTextStyle(styles.inCartText)}>IN CART</Text>
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
            <View style={asViewStyle(styles.cartSection)}>
              <LinearGradient
                colors={[colors.card, colors.card + 'F0']}
                style={asViewStyle(styles.cartGradient)}
              >
                <View style={[asViewStyle(styles.cartSummary), { backgroundColor: 'transparent' }]}>
                  <View style={asViewStyle(styles.cartHeader)}>
                    <View style={[asViewStyle(styles.cartIconContainer), { backgroundColor: colors.primary + '20' }]}>
                      <ShoppingCart size={24} color={colors.primary} />
                    </View>
                    <View style={asViewStyle(styles.cartHeaderText)}>
                      <Text style={asArrayTextStyle([styles.cartTitle, { color: colors.text }])}>
                        Your Cart
                      </Text>
                      <Text style={asArrayTextStyle([styles.cartSubtitle, { color: colors.textSecondary }])}>
                        {getCartItemCount()} {getCartItemCount() === 1 ? 'item' : 'items'} selected
                      </Text>
                    </View>
                    <View style={asArrayViewStyle([styles.cartBadge, { backgroundColor: colors.primary }])}>
                      <Text style={asTextStyle(styles.cartBadgeText)}>
                        {getCartItemCount()}
                      </Text>
                    </View>
                  </View>

                  <View style={asViewStyle(styles.cartItems)}>
                    {orderType === 'per-item' ? (
                      cart.map((item) => (
                        <View key={item.id} style={[asViewStyle(styles.cartItem), { borderBottomColor: colors.border }]}>
                          <View style={asViewStyle(styles.cartItemInfo)}>
                            <Text style={asArrayTextStyle([styles.cartItemName, { color: colors.text }])}>
                              {item.name}
                            </Text>
                            <Text style={asArrayTextStyle([styles.cartItemDetails, { color: colors.textSecondary }])}>
                              {item.quantity} × KSh {(item.price || 0).toLocaleString()}
                            </Text>
                          </View>
                          <Text style={asArrayTextStyle([styles.cartItemPrice, { color: colors.primary }])}>
                            KSh {((item.price || 0) * item.quantity).toLocaleString()}
                          </Text>
                        </View>
                      ))
                    ) : (
                      bagCart.map((item) => (
                        <View key={item.id} style={[asViewStyle(styles.cartItem), { borderBottomColor: colors.border }]}>
                          <View style={asViewStyle(styles.cartItemInfo)}>
                            <Text style={asArrayTextStyle([styles.cartItemName, { color: colors.text }])}>
                              {item.name}
                            </Text>
                            <Text style={asArrayTextStyle([styles.cartItemDetails, { color: colors.textSecondary }])}>
                              {item.quantity} × KSh {(item.price || 0).toLocaleString()}
                            </Text>
                          </View>
                          <Text style={asArrayTextStyle([styles.cartItemPrice, { color: colors.primary }])}>
                            KSh {((item.price || 0) * item.quantity).toLocaleString()}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>

                  <View style={[asViewStyle(styles.cartTotal), { borderTopColor: colors.border }]}>
                    <Text style={asArrayTextStyle([styles.totalLabel, { color: colors.text }])}>
                      Total
                    </Text>
                    <Text style={asArrayTextStyle([styles.totalAmount, { color: colors.primary }])}>
                      KSh {(getCartTotal() || 0).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Delivery Information */}
          {getCartItemCount() > 0 && (
            <View style={asViewStyle(styles.deliverySection)}>
              <Text style={asArrayTextStyle([styles.deliverySectionTitle, { color: colors.text }])}>
                Delivery Information
              </Text>
              <View style={asArrayViewStyle([styles.deliveryCard, { backgroundColor: colors.card }])}>
                <View style={asViewStyle(styles.inputGroup)}>
                  <View style={asArrayViewStyle([styles.inputIconContainer, { backgroundColor: colors.primary + '20' }])}>
                    <MapPin size={24} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.background, color: colors.text }
                    ] as TextStyle[]}
                    placeholder="Enter your delivery address"
                    placeholderTextColor={colors.textSecondary}
                    value={address}
                    onChangeText={setAddress}
                    multiline
                  />
                </View>
                <View style={asViewStyle(styles.inputGroup)}>
                  <View style={asArrayViewStyle([styles.inputIconContainer, { backgroundColor: colors.primary + '20' }])}>
                    <Phone size={24} color={colors.primary} />
                  </View>
                  <TextInput
                    style={asArrayTextStyle([styles.input, { backgroundColor: colors.background, color: colors.text }])}
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
            <View style={asViewStyle(styles.checkoutSection)}>
              <TouchableOpacity
                style={styles.checkoutGradient as ViewStyle}
                onPress={handleCheckout}
                activeOpacity={0.7}
                onPressIn={(e) => {
                  e.currentTarget.setNativeProps({
                    style: {
                      transform: [{ scale: 0.98 }],
                      shadowOpacity: 0.15,
                      elevation: 6
                    }
                  });
                }}
                onPressOut={(e) => {
                  e.currentTarget.setNativeProps({
                    style: {
                      transform: [{ scale: 1.0 }],
                      shadowOpacity: 0.3,
                      elevation: 12
                    }
                  });
                }}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primary + 'E6']}
                  style={asViewStyle(styles.checkoutGradient)}
                >
                  <View style={asViewStyle(styles.checkoutButton)}>
                    <ShoppingCart size={24} color="#FFFFFF" />
                    <Text style={asTextStyle(styles.checkoutButtonText)}>
                      Proceed to Payment • KSh {(getCartTotal() || 0).toLocaleString()}
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
          orderData={{
            orderId: currentOrder.id || '',
            service: currentOrder.category || 'Laundry Service',
            items: cart.map(item => `${item.quantity}x ${item.name}`),
            total: getCartTotal(),
            area: currentOrder.address || '',
            phone: currentOrder.phone || '',
            pickupTime: currentOrder.pickupTime || '',
            paymentMethod: currentOrder.paymentMethod || 'Not specified',
            isPaid: currentOrder.isPaid || false
          }}
        />
      )}

      {/* WhatsApp Support Button */}
      <WhatsAppButton />
    </SafeAreaView>
  );
}

// Type-safe style creation with explicit typing for each style object
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
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
    marginVertical: 4,
    transform: [{ perspective: 1000 }],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  orderTypeCardSelected: {
    shadowColor: Colors.light.primary,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 15,
    transform: [{ perspective: 1000 }, { translateY: -3 }],
    borderColor: Colors.light.primary + '40',
    // Ensure only ViewStyle properties are here
    // Remove any TextStyle/ImageStyle properties if present
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
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
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
    paddingVertical: 8,
  },
  categoriesContent: {
    paddingRight: 20,
    gap: 16,
    paddingVertical: 4,
  },
  categoryCard: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    minWidth: 150,
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    marginVertical: 4,
  },
  categoryCardSelected: {
    shadowColor: Colors.light.primary,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    transform: [{ translateY: -2 }],
    borderColor: Colors.light.primary + '40',
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
    width: 84,  // Increased from 68
    height: 84, // Increased from 68
    borderRadius: 42, // Adjusted for the new size
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  categoryImage: {
    width: 60, // Increased from 48
    height: 60, // Increased from 48
    resizeMode: 'contain',
  },
  categoryName: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
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
    marginTop: 8,
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    marginVertical: 2,
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    marginVertical: 2,
  },
  serviceItemSelected: {
    shadowColor: Colors.light.primary,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 10,
    transform: [{ translateY: -1 }],
    borderColor: Colors.light.primary + '30',
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
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
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    marginVertical: 2,
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    // Remove any TextStyle or ImageStyle properties if present
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
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
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
