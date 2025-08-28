import React, { useState, useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Helper functions to handle type assertions
const asViewStyle = (style: any): StyleProp<ViewStyle> => style as StyleProp<ViewStyle>;
const asTextStyle = (style: any): StyleProp<TextStyle> => style as StyleProp<TextStyle>;
const asImageStyle = (style: any): StyleProp<ImageStyle> => style as StyleProp<ImageStyle>;
const asArrayViewStyle = (styles: any[]): StyleProp<ViewStyle>[] => styles as StyleProp<ViewStyle>[];
const asArrayTextStyle = (styles: any[]): StyleProp<TextStyle>[] => styles as StyleProp<TextStyle>[];
const asArrayImageStyle = (styles: any[]): StyleProp<ImageStyle>[] => styles as StyleProp<ImageStyle>[];
import { StatusBar } from 'expo-status-bar';
import { Plus, Minus, ShoppingCart, MapPin, Clock, Phone, Sparkles, Package2, Info, Calendar, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PaymentModal } from '../../components/PaymentModal';
import { OrderConfirmationModal } from '../../components/OrderConfirmationModal';
import TimeSelectionModal from '../../components/TimeSelectionModal';
import { WhatsAppButton } from '../../components/ui/WhatsAppButton';
import ModernLocationPicker from '../../components/ModernLocationPicker';
import { orderService } from '../../services/orderService';
import { notificationService } from '../../services/notificationService';
import { mapsService } from '../../services/mapsService';
import { getSavedAddresses, SavedAddress, addSavedAddress } from '../../services/userProfileService';
// Utility function to generate unique keys
const generateUniqueKey = (prefix: string, id: string | undefined, index: number): string => {
  return `${prefix}-${id || 'unknown'}-${index}-${Date.now()}`;
};
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

// Scent options available in Kenya
const scentOptions = [
  {
    id: 'none',
    name: 'No Added Scent',
    description: 'Standard clean without additional fragrance',
    price: 0,
    popular: false,
    icon: '🌿'
  },
  {
    id: 'fresh-linen',
    name: 'Fresh Linen',
    description: 'Clean, crisp cotton-like freshness',
    price: 50,
    popular: true,
    icon: '🌬️'
  },
  {
    id: 'lavender',
    name: 'Lavender Sensations',
    description: 'Calming floral lavender fragrance',
    price: 60,
    popular: true,
    icon: '🌸'
  },
  {
    id: 'spring-fresh',
    name: 'Spring Sensations',
    description: 'Light, refreshing spring meadow scent',
    price: 55,
    popular: false,
    icon: '🌺'
  },
  {
    id: 'tropical',
    name: 'Tropical Sensations',
    description: 'Vibrant tropical island fragrance',
    price: 55,
    popular: false,
    icon: '🌴'
  },
  {
    id: 'lily-fresh',
    name: 'Lily Fresh',
    description: 'Elegant white lily floral scent',
    price: 60,
    popular: false,
    icon: '🌼'
  },
  {
    id: 'morning-meadow',
    name: 'Morning Meadow',
    description: 'Soft, natural meadow freshness',
    price: 55,
    popular: false,
    icon: '🌅'
  }
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
  const [addressEstate, setAddressEstate] = useState('');
  const [addressDetails, setAddressDetails] = useState({
    buildingName: '',
    floorNumber: '',
    doorNumber: '',
    additionalInfo: '',
    label: '',
    placeType: ''
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [orderStep, setOrderStep] = useState<'cart' | 'payment' | 'processing' | 'confirmed'>('cart');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [pickupTime, setPickupTime] = useState<string>('');
  const [deliveryTime, setDeliveryTime] = useState<string>('');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [selectedScent, setSelectedScent] = useState<string>('none');
  const [showScentModal, setShowScentModal] = useState(false);
  const [showAddressDetailsModal, setShowAddressDetailsModal] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const lastPickerPickRef = useRef<number | null>(null);
  const latestAddressRef = useRef<string>('');

  useEffect(() => { latestAddressRef.current = address; }, [address]);
  // Simplified address details (floating card) – removed chips & auto-resize for clarity

  // Load saved addresses and auto-populate default address
  useEffect(() => {
    const loadSavedAddresses = async () => {
      if (user?.uid) {
        try {
          const addresses = await getSavedAddresses(user.uid);
          setSavedAddresses(addresses);
          
          // Auto-populate with default address if available
          const defaultAddress = addresses.find(addr => addr.isDefault);
          if (defaultAddress && !address) {
            setAddress(defaultAddress.address);
          }
        } catch (error) {
          console.error('Error loading saved addresses:', error);
        }
      }
    };

    loadSavedAddresses();
  }, [user?.uid]);

  // Fallback: if address just set via picker and modal not yet opened, open automatically
  useEffect(() => {
    if (lastPickerPickRef.current) {
      const elapsed = Date.now() - lastPickerPickRef.current;
      if (elapsed < 3000 && address && !showAddressDetailsModal) {
        const timer = setTimeout(() => {
          if (!showAddressDetailsModal) setShowAddressDetailsModal(true);
        }, 250); // short fallback delay
        return () => clearTimeout(timer);
      }
    }
  }, [address, showAddressDetailsModal]);

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
    const selectedScentOption = scentOptions.find(scent => scent.id === selectedScent);
    const scentPrice = selectedScentOption ? selectedScentOption.price : 0;
    
    if (orderType === 'per-item') {
      return cart.reduce((total, item) => total + (item.price * item.quantity), 0) + scentPrice;
    } else {
      return bagCart.reduce((total, item) => total + (item.price * item.quantity), 0) + scentPrice;
    }
  };

  const getCartItemCount = () => {
    if (orderType === 'per-item') {
      return cart.reduce((total, item) => total + item.quantity, 0);
    } else {
      return bagCart.reduce((total, item) => total + item.quantity, 0);
    }
  };

  const handleSaveAddress = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to save addresses.');
      return;
    }

    if (!address.trim()) {
      Alert.alert('No Address', 'Please enter an address to save.');
      return;
    }

    Alert.prompt(
      'Save Address',
      'Enter a label for this address (e.g., Home, Office, etc.)',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Save',
          onPress: async (label) => {
            if (!label?.trim()) {
              Alert.alert('Invalid Label', 'Please enter a valid label for the address.');
              return;
            }

            try {
              const addressData = {
                label: label.trim(),
                address: address.trim(),
                city: addressEstate || 'Nairobi', // Use addressEstate or default to Nairobi
                postalCode: '', // Could be extracted from address or left empty
                instructions: additionalInfo.trim() || undefined,
                type: 'other' as const, // Default type, could be made selectable
                isDefault: false, // User can set this later in profile
              };

              await addSavedAddress(user.uid, addressData);
              
              Alert.alert(
                'Address Saved!',
                `Your address has been saved as "${label}". You can access it from your profile or use it in future orders.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error saving address:', error);
              Alert.alert(
                'Save Failed',
                'Failed to save the address. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ],
      'plain-text',
      '', // Default text
      'default' // Keyboard type
    );
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
      const selectedScentOption = scentOptions.find(scent => scent.id === selectedScent);
      const fullAddress = additionalInfo.trim()
        ? `${address.trim()}\n${additionalInfo.trim()}`
        : address.trim();
      const orderData = {
        category: selectedCategory,
        date: new Date().toISOString().split('T')[0],
        address: fullAddress,
        phone: phoneNumber,
        completedAt: null,
        specialInstructions: additionalInfo.trim() || null,
        ...(addressEstate && { estate: addressEstate }),
        // Add structured address details for better organization
        addressDetails: {
          mainAddress: address.trim(),
          estate: addressEstate,
          buildingName: addressDetails.buildingName,
          floorNumber: addressDetails.floorNumber,
          doorNumber: addressDetails.doorNumber,
          additionalInfo: addressDetails.additionalInfo,
          label: addressDetails.label,
          placeType: addressDetails.placeType
        },
        status: 'pending' as const,
        items: orderType === 'per-item' 
          ? cart.map(item => `${item.name} (${item.quantity})`)
          : bagCart.map(item => `${item.name} (${item.quantity})`),
        total: getCartTotal(),
        pickupTime: pickupTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Use selected time or tomorrow
        notes: `Order Type: ${orderType}, Phone: ${phoneNumber}, Payment: ${paymentMethod}${selectedScent !== 'none' ? `, Scent: ${selectedScentOption?.name}` : ''}${additionalInfo.trim() ? `, Address Info: ${additionalInfo.trim()}` : ''}`,
        isPaid: paymentMethod !== 'cash',
        ...(selectedScent !== 'none' && { 
          scent: {
            id: selectedScent,
            name: selectedScentOption?.name,
            price: selectedScentOption?.price
          }
        }),
        ...(deliveryTime && deliveryTime.trim() !== '' && { preferredDeliveryTime: deliveryTime }), // Only include if deliveryTime exists and is not empty
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
  area: fullAddress,
        ...(addressEstate && { estate: addressEstate }),
        phone: phoneNumber,
        pickupTime: pickupTime || 'Tomorrow, 9:00 AM - 5:00 PM',
        preferredDeliveryTime: deliveryTime,
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
  setAddressEstate('');
  setAddressDetails({
    buildingName: '',
    floorNumber: '',
    doorNumber: '',
    additionalInfo: '',
    label: '',
    placeType: ''
  });
      setPhoneNumber('');
      setPickupTime('');
      setDeliveryTime('');
  setAdditionalInfo('');
      
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
            <View style={asViewStyle(styles.sectionTitleContainer)}>
              <Text style={asArrayTextStyle([styles.sectionTitle, { color: colors.text }])}>
                Service Categories
              </Text>
              <Text style={asArrayTextStyle([styles.sectionSubtitle, { color: colors.textSecondary }])}>
                Choose the type of service you need
              </Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={asViewStyle(styles.categoriesContainer)}
              contentContainerStyle={asViewStyle(styles.categoriesContent)}
              decelerationRate="fast"
              snapToInterval={178} // width + gap
              snapToAlignment="start"
            >
             {serviceCategories.map((category, index) => (
  <TouchableOpacity
    key={`category-${category.id}-${index}`}
                  style={[
                    asViewStyle(styles.categoryCard),
                    selectedCategory === category.id && asViewStyle(styles.categoryCardSelected),
                    { backgroundColor: colors.card }
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                  activeOpacity={0.7}
                >
                  {selectedCategory === category.id && (
                    <LinearGradient
                      colors={[colors.primary + '20', colors.primary + '10', colors.primary + '05']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={asViewStyle(styles.categoryGradient)}
                    />
                  )}
                  <View style={[
                    asViewStyle(styles.categoryIconContainer),
                    { backgroundColor: selectedCategory === category.id ? colors.primary + '15' : colors.background }
                  ]}>
                    <Image source={category.image} style={asImageStyle(styles.categoryImage)} />
                    {selectedCategory === category.id && (
                      <View style={asViewStyle(styles.categoryIconOverlay)} />
                    )}
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
                      color: selectedCategory === category.id ? colors.primary + 'BB' : colors.textSecondary,
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
                    <View style={asViewStyle(styles.categoryPopularBadge)}>
                      <Text style={asTextStyle(styles.categoryPopularText)}>POPULAR</Text>
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
                {filteredBagServices.map((service, index) => {
  const isInCart = bagCart.some(item => item.id === service.id);
  const quantity = getItemQuantity(service.id);
  return (
    <TouchableOpacity
      key={`bag-service-${service.id}-${index}`}
      style={[
        asViewStyle(styles.bagServiceItem),
        { backgroundColor: colors.card },
        isInCart && asViewStyle(styles.serviceItemSelected)
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
                    </TouchableOpacity>
                  );
                })}
              </>
            ) : (
              <>
              <Text style={asArrayTextStyle([styles.servicesSectionTitle, { color: colors.text }])}>
                {serviceCategories.find(cat => cat.id === selectedCategory)?.name} Services
              </Text>
                  {filteredServices.map((service, index) => {
  const isInCart = cart.some(item => item.id === service.id);
  const quantity = getItemQuantity(service.id);
  return (
    <TouchableOpacity
      key={`service-${service.id}-${index}`}
      style={[
        asViewStyle(styles.serviceItem),
        { backgroundColor: colors.card },
        isInCart && asViewStyle(styles.serviceItemSelected)
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
                    </TouchableOpacity>
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
  cart.map((item, index) => (
    <View key={`cart-${item.id}-${index}`} style={[asViewStyle(styles.cartItem), { borderBottomColor: colors.border }]}>
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
  bagCart.map((item, index) => (
    <View key={`bag-cart-${item.id}-${index}`} style={[asViewStyle(styles.cartItem), { borderBottomColor: colors.border }]}>
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

                  {/* Scent Selection */}
                  <TouchableOpacity 
                    style={[asViewStyle(styles.scentSelector), { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => setShowScentModal(true)}
                  >
                    <View style={asViewStyle(styles.scentSelectorContent)}>
                      <View style={asViewStyle(styles.scentIconContainer)}>
                        <Sparkles size={20} color={colors.primary} />
                      </View>
                      <View style={asViewStyle(styles.scentInfo)}>
                        <Text style={asArrayTextStyle([styles.scentTitle, { color: colors.text }])}>
                          Add Scent
                        </Text>
                        <Text style={asArrayTextStyle([styles.scentSubtitle, { color: colors.textSecondary }])}>
                          {selectedScent !== 'none' ? scentOptions.find(s => s.id === selectedScent)?.name : 'Choose a premium fragrance'}
                        </Text>
                      </View>
                      <View style={asViewStyle(styles.scentPrice)}>
                        {selectedScent !== 'none' && (
                          <Text style={asArrayTextStyle([styles.scentPriceText, { color: colors.primary }])}>
                            +KSh {scentOptions.find(s => s.id === selectedScent)?.price}
                          </Text>
                        )}
                        <ChevronRight size={16} color={colors.textSecondary} />
                      </View>
                    </View>
                  </TouchableOpacity>

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
        <>
          <View style={asViewStyle(styles.deliverySection)}>
            <LinearGradient
              colors={['rgba(0, 122, 255, 0.03)', 'rgba(0, 122, 255, 0.01)']}
              style={asViewStyle(styles.deliverySectionGradient)}
            >
              <View style={asViewStyle(styles.deliverySectionHeader)}>
                <View style={asViewStyle(styles.deliveryHeaderIcon)}>
                  <LinearGradient
                    colors={[colors.primary, colors.primary + 'CC']}
                    style={asViewStyle(styles.deliveryIconGradient)}
                  >
                    <MapPin size={24} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <View style={asViewStyle(styles.deliveryHeaderText)}>
                  <Text style={asArrayTextStyle([styles.deliverySectionTitle, { color: colors.text }])}>
                    Delivery Information
                  </Text>
                  <Text style={asArrayTextStyle([styles.deliverySectionSubtitle, { color: colors.textSecondary }])}>
                    Where should we deliver your items?
                  </Text>
                </View>
              </View>

              <View style={asArrayViewStyle([styles.deliveryCard, { backgroundColor: colors.card }])}>
                {/* Premium Address Input Mode Toggle */}
                <View style={asViewStyle([styles.addressModeToggle, { backgroundColor: colors.background }])}>
                  <TouchableOpacity
                    style={asViewStyle([
                      styles.addressModeButton,
                      !useManualAddress && styles.addressModeButtonActive,
                      { backgroundColor: !useManualAddress ? colors.primary : 'transparent' }
                    ])}
                    onPress={() => setUseManualAddress(false)}
                  >
                    <MapPin size={18} color={!useManualAddress ? '#FFFFFF' : colors.textSecondary} />
                    <Text style={asTextStyle([
                      styles.addressModeButtonText,
                      { color: !useManualAddress ? '#FFFFFF' : colors.textSecondary }
                    ])}>
                      Map Picker
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={asViewStyle([
                      styles.addressModeButton,
                      useManualAddress && styles.addressModeButtonActive,
                      { backgroundColor: useManualAddress ? colors.primary : 'transparent' }
                    ])}
                    onPress={() => setUseManualAddress(true)}
                  >
                    <Ionicons name="create-outline" size={18} color={useManualAddress ? '#FFFFFF' : colors.textSecondary} />
                    <Text style={asTextStyle([
                      styles.addressModeButtonText,
                      { color: useManualAddress ? '#FFFFFF' : colors.textSecondary }
                    ])}>
                      Type Address
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={asViewStyle(styles.addressInputContainer)}>
                  {!useManualAddress ? (
                    // Premium Interactive Map Picker - Full Width
                    <View style={asViewStyle(styles.fullWidthLayout)}>
                      <TouchableOpacity
                        style={asViewStyle([styles.premiumMapPickerCard, {
                          backgroundColor: colors.background,
                          borderColor: address ? colors.primary + '30' : colors.border + '30'
                        }])}
                        onPress={() => setShowLocationPicker(true)}
                        activeOpacity={0.7}
                      >
                        <View style={asViewStyle(styles.mapPickerCardHeader)}>
                          <View style={asViewStyle([styles.mapPickerIconLarge, { backgroundColor: colors.primary + '15' }])}>
                            <MapPin size={24} color={colors.primary} />
                          </View>
                          <View style={asViewStyle(styles.mapPickerHeaderText)}>
                            <Text style={asTextStyle([styles.mapPickerTitle, { color: colors.text }])}>
                              {address ? 'Selected Location' : 'Choose Your Location'}
                            </Text>
                            <Text style={asTextStyle([styles.mapPickerSubtitle, { color: colors.textSecondary }])}>
                              Tap to select delivery address on map
                            </Text>
                          </View>
                          <View style={asViewStyle([styles.mapPickerChevron, { backgroundColor: colors.primary + '10' }])}>
                            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                          </View>
                        </View>

                        {address && (
                          <View style={asViewStyle([styles.selectedAddressPreview, { borderTopColor: colors.border + '30' }])}>
                            <Text style={asTextStyle([styles.selectedAddressText, { color: colors.text }])} numberOfLines={2}>
                              {address}
                            </Text>
                            
                            {/* Add Details Button for Map Picker */}
                            <View style={asViewStyle(styles.addressActionsRow)}>
                              <TouchableOpacity
                                onPress={() => setShowAddressDetailsModal(true)}
                                style={asViewStyle([styles.addDetailsButton, { borderColor: colors.primary + '30' }])}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                                <Text style={asTextStyle([styles.addDetailsButtonText, { color: colors.primary }])}>
                                  {additionalInfo ? 'Edit Details' : 'Add Details'}
                                </Text>
                              </TouchableOpacity>

                              {address.length > 20 && (
                                <TouchableOpacity
                                  style={asViewStyle([styles.saveForLaterButton, { backgroundColor: colors.primary + '08' }])}
                                  onPress={handleSaveAddress}
                                  activeOpacity={0.8}
                                >
                                  <Ionicons name="bookmark-outline" size={14} color={colors.primary} />
                                  <Text style={asTextStyle([styles.saveForLaterText, { color: colors.primary }])}>
                                    Save for later
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>

                            {/* Display Additional Details */}
                            {additionalInfo && (
                              <View style={asViewStyle([styles.additionalDetailsDisplay, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '20' }])}>
                                <View style={asViewStyle(styles.additionalDetailsHeader)}>
                                  <Ionicons name="information-circle" size={16} color={colors.primary} />
                                  <Text style={asTextStyle([styles.additionalDetailsTitle, { color: colors.primary }])}>
                                    Additional Details
                                  </Text>
                                  <TouchableOpacity
                                    onPress={() => setShowAddressDetailsModal(true)}
                                    style={asViewStyle(styles.editDetailsButton)}
                                  >
                                    <Ionicons name="create-outline" size={14} color={colors.primary} />
                                  </TouchableOpacity>
                                </View>
                                <View style={asViewStyle(styles.additionalDetailsContent)}>
                                  {additionalInfo.split('\n').map((detail, index) => (
                                    <View key={`detail-${index}-${detail.substring(0, 10)}`} style={asViewStyle(styles.detailItem)}>
                                      <View style={asViewStyle([styles.detailDot, { backgroundColor: colors.primary }])} />
                                      <Text style={asTextStyle([styles.detailText, { color: colors.text }])}>
                                        {detail.trim()}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            )}
                          </View>
                        )}
                      </TouchableOpacity>

                      <Modal visible={showLocationPicker} animationType="slide" presentationStyle="fullScreen">
                        <ModernLocationPicker
                          onLocationSelect={({ latitude, longitude, address: addressData }) => {
                            const coords = { latitude, longitude };
                            const formatted = addressData?.fullAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                            const structured = {
                              estate: addressData?.estate,
                              building: addressData?.building,
                              road: addressData?.road,
                              area: addressData?.area,
                              county: addressData?.county,
                              // Capture detailed information from the form
                              buildingName: addressData?.buildingName,
                              floorNumber: addressData?.floorNumber,
                              doorNumber: addressData?.doorNumber,
                              additionalInfo: addressData?.additionalInfo,
                              label: addressData?.label,
                              placeType: addressData?.placeType
                            };

                            setAddress(formatted);
                            setAddressEstate(structured?.estate || '');

                            // Store structured address details
                            setAddressDetails({
                              buildingName: addressData?.buildingName || '',
                              floorNumber: addressData?.floorNumber || '',
                              doorNumber: addressData?.doorNumber || '',
                              additionalInfo: addressData?.additionalInfo || '',
                              label: addressData?.label || '',
                              placeType: addressData?.placeType || ''
                            });

                            // Store the complete address details in formatted string for display
                            setAdditionalInfo(
                              [
                                addressData?.buildingName && `Building: ${addressData.buildingName}`,
                                addressData?.floorNumber && `Floor: ${addressData.floorNumber}`,
                                addressData?.doorNumber && `Door: ${addressData.doorNumber}`,
                                addressData?.additionalInfo && `Notes: ${addressData.additionalInfo}`,
                                addressData?.label && `Label: ${addressData.label}`,
                                addressData?.placeType && `Type: ${addressData.placeType}`
                              ].filter(Boolean).join('\n') || ''
                            );

                            lastPickerPickRef.current = Date.now();
                            setShowLocationPicker(false);
                            console.log('[AddressDetails] Complete address data:', addressData);
                            console.log('[AddressDetails] Formatted additional info:', additionalInfo);
                            // Open modal as soon as interactions/animation settle
                            InteractionManager.runAfterInteractions(() => {
                              requestAnimationFrame(() => {
                                if (!showAddressDetailsModal) {
                                  setShowAddressDetailsModal(true);
                                }
                              });
                            });
                          }}
                          onClose={() => setShowLocationPicker(false)} />
                      </Modal>

                      {/* Phone Input Below Map Picker */}
                      <View style={asViewStyle([styles.premiumInputCard, { marginTop: 20 }])}>
                        <View style={asViewStyle(styles.inputCardHeader)}>
                          <View style={asViewStyle([styles.inputCardIcon, { backgroundColor: colors.primary + '15' }])}>
                            <Phone size={20} color={colors.primary} />
                          </View>
                          <View style={asViewStyle(styles.inputCardHeaderText)}>
                            <Text style={asTextStyle([styles.inputCardTitle, { color: colors.text }])}>
                              Contact Number
                            </Text>
                            <Text style={asTextStyle([styles.inputCardSubtitle, { color: colors.textSecondary }])}>
                              For pickup and delivery coordination
                            </Text>
                          </View>
                        </View>

                        <View style={asViewStyle(styles.textInputWrapper)}>
                          <TextInput
                            style={asArrayTextStyle([styles.premiumPhoneInputFull, {
                              backgroundColor: colors.background,
                              color: colors.text,
                              borderColor: phoneNumber ? colors.primary + '40' : colors.border + '40'
                            }])}
                            placeholder="Enter your phone number"
                            placeholderTextColor={colors.textSecondary + '60'}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad" />
                          {phoneNumber && (
                            <View style={asViewStyle(styles.inputValidationIcon)}>
                              <View style={asViewStyle([styles.validationIconBadge, { backgroundColor: colors.primary }])}>
                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  ) : (
                    // Premium Manual Text Input - Full Width
                    <View style={asViewStyle(styles.fullWidthLayout)}>
                      <View style={asViewStyle(styles.premiumInputCard)}>
                        <View style={asViewStyle(styles.inputCardHeader)}>
                          <View style={asViewStyle([styles.inputCardIcon, { backgroundColor: colors.primary + '15' }])}>
                            <Ionicons name="create-outline" size={20} color={colors.primary} />
                          </View>
                          <View style={asViewStyle(styles.inputCardHeaderText)}>
                            <Text style={asTextStyle([styles.inputCardTitle, { color: colors.text }])}>
                              Type Your Address
                            </Text>
                            <Text style={asTextStyle([styles.inputCardSubtitle, { color: colors.textSecondary }])}>
                              Include all relevant details for precise delivery
                            </Text>
                          </View>
                          <Text style={asTextStyle([styles.characterCounter, { color: colors.textSecondary }])}>
                            {address.length} chars
                          </Text>
                        </View>

                        <View style={asViewStyle(styles.textInputWrapper)}>
                          <TextInput
                            style={asArrayTextStyle([styles.premiumTextInputLarge, {
                              backgroundColor: colors.background,
                              color: colors.text,
                              borderColor: address ? colors.primary + '40' : colors.border + '40'
                            }])}
                            placeholder="Apartment 4B, Valley Arcade Apartments, Lavington, Nairobi..."
                            placeholderTextColor={colors.textSecondary + '60'}
                            value={address}
                            onChangeText={setAddress}
                            multiline={true}
                            numberOfLines={4}
                            textAlignVertical="top" />
                          {address && (
                            <View style={asViewStyle(styles.inputValidationIcon)}>
                              <View style={asViewStyle([styles.validationIconBadge, { backgroundColor: colors.primary }])}>
                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                              </View>
                            </View>
                          )}
                        </View>

                        {address && (
                          <View style={asViewStyle(styles.addressActionsRow)}>
                            <TouchableOpacity
                              onPress={() => setShowAddressDetailsModal(true)}
                              style={asViewStyle([styles.addDetailsButton, { borderColor: colors.primary + '30' }])}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                              <Text style={asTextStyle([styles.addDetailsButtonText, { color: colors.primary }])}>
                                {additionalInfo ? 'Edit Details' : 'Add Details'}
                              </Text>
                            </TouchableOpacity>

                            {address.length > 20 && (
                              <TouchableOpacity
                                style={asViewStyle([styles.saveForLaterButton, { backgroundColor: colors.primary + '08' }])}
                                onPress={handleSaveAddress}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="bookmark-outline" size={14} color={colors.primary} />
                                <Text style={asTextStyle([styles.saveForLaterText, { color: colors.primary }])}>
                                  Save for later
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}

                        {/* Display Additional Details for Manual Address */}
                        {address && additionalInfo && (
                          <View style={asViewStyle([styles.additionalDetailsDisplay, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '20' }])}>
                            <View style={asViewStyle(styles.additionalDetailsHeader)}>
                              <Ionicons name="information-circle" size={16} color={colors.primary} />
                              <Text style={asTextStyle([styles.additionalDetailsTitle, { color: colors.primary }])}>
                                Additional Details
                              </Text>
                              <TouchableOpacity
                                onPress={() => setShowAddressDetailsModal(true)}
                                style={asViewStyle(styles.editDetailsButton)}
                              >
                                <Ionicons name="create-outline" size={14} color={colors.primary} />
                              </TouchableOpacity>
                            </View>
                            <View style={asViewStyle(styles.additionalDetailsContent)}>
                              {additionalInfo.split('\n').map((detail, index) => (
                                <View key={`detail-${index}-${detail.substring(0, 10)}`} style={asViewStyle(styles.detailItem)}>
                                  <View style={asViewStyle([styles.detailDot, { backgroundColor: colors.primary }])} />
                                  <Text style={asTextStyle([styles.detailText, { color: colors.text }])}>
                                    {detail.trim()}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>

                      {/* Phone Input Below Address Input */}
                      <View style={asViewStyle([styles.premiumInputCard, { marginTop: 20 }])}>
                        <View style={asViewStyle(styles.inputCardHeader)}>
                          <View style={asViewStyle([styles.inputCardIcon, { backgroundColor: colors.primary + '15' }])}>
                            <Phone size={20} color={colors.primary} />
                          </View>
                          <View style={asViewStyle(styles.inputCardHeaderText)}>
                            <Text style={asTextStyle([styles.inputCardTitle, { color: colors.text }])}>
                              Contact Number
                            </Text>
                            <Text style={asTextStyle([styles.inputCardSubtitle, { color: colors.textSecondary }])}>
                              For pickup and delivery coordination
                            </Text>
                          </View>
                        </View>

                        <View style={asViewStyle(styles.textInputWrapper)}>
                          <TextInput
                            style={asArrayTextStyle([styles.premiumPhoneInputFull, {
                              backgroundColor: colors.background,
                              color: colors.text,
                              borderColor: phoneNumber ? colors.primary + '40' : colors.border + '40'
                            }])}
                            placeholder="Enter your phone number"
                            placeholderTextColor={colors.textSecondary + '60'}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad" />
                          {phoneNumber && (
                            <View style={asViewStyle(styles.inputValidationIcon)}>
                              <View style={asViewStyle([styles.validationIconBadge, { backgroundColor: colors.primary }])}>
                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                              </View>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Email Input Below Phone Input */}
                      <View style={asViewStyle([styles.premiumInputCard, { marginTop: 16 }])}>
                        <View style={asViewStyle(styles.inputCardHeader)}>
                          <View style={asViewStyle([styles.inputCardIcon, { backgroundColor: colors.primary + '15' }])}>
                            <Ionicons name="mail-outline" size={20} color={colors.primary} />
                          </View>
                          <View style={asViewStyle(styles.inputCardHeaderText)}>
                            <Text style={asTextStyle([styles.inputCardTitle, { color: colors.text }])}>
                              Email Address (Optional)
                            </Text>
                            <Text style={asTextStyle([styles.inputCardSubtitle, { color: colors.textSecondary }])}>
                              For receipt delivery and order updates
                            </Text>
                          </View>
                        </View>

                        <View style={asViewStyle(styles.textInputWrapper)}>
                          <TextInput
                            style={asArrayTextStyle([styles.premiumPhoneInputFull, {
                              backgroundColor: colors.background,
                              color: colors.text,
                              borderColor: customerEmail ? colors.primary + '40' : colors.border + '40'
                            }])}
                            placeholder="Enter your email address"
                            placeholderTextColor={colors.textSecondary + '60'}
                            value={customerEmail}
                            onChangeText={setCustomerEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            textContentType="emailAddress" />
                          {customerEmail && (
                            <View style={asViewStyle(styles.inputValidationIcon)}>
                              <View style={asViewStyle([styles.validationIconBadge, { backgroundColor: colors.primary }])}>
                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Time Selection Section */}
          <View style={asViewStyle(styles.deliverySection)}>
            <LinearGradient
              colors={['rgba(0, 122, 255, 0.03)', 'rgba(0, 122, 255, 0.01)']}
              style={asViewStyle(styles.deliverySectionGradient)}
            >
              <View style={asViewStyle(styles.deliverySectionHeader)}>
                <View style={asViewStyle(styles.deliveryHeaderIcon)}>
                  <LinearGradient
                    colors={[colors.primary, colors.primary + 'CC']}
                    style={asViewStyle(styles.deliveryIconGradient)}
                  >
                    <Calendar size={24} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <View style={asViewStyle(styles.deliveryHeaderText)}>
                  <Text style={asArrayTextStyle([styles.deliverySectionTitle, { color: colors.text }])}>
                    Pickup & Delivery Schedule
                  </Text>
                  <Text style={asArrayTextStyle([styles.deliverySectionSubtitle, { color: colors.textSecondary }])}>
                    When should we collect and deliver your items?
                  </Text>
                </View>
              </View>

              <View style={asArrayViewStyle([styles.deliveryCard, { backgroundColor: colors.card }])}>
                <TouchableOpacity
                  style={asViewStyle(styles.timeSelectionButton)}
                  onPress={() => setShowTimeModal(true)}
                  activeOpacity={0.7}
                >
                  <View style={asArrayViewStyle([styles.inputCardIcon, { backgroundColor: colors.primary + '20' }])}>
                    <Calendar size={24} color={colors.primary} />
                  </View>
                  <View style={asViewStyle(styles.timeSelectionContent)}>
                    <Text style={asArrayTextStyle([styles.timeSelectionLabel, { color: colors.textSecondary }])}>
                      Pickup Time
                    </Text>
                    <Text style={asArrayTextStyle([styles.timeSelectionValue, { color: colors.text }])}>
                      {pickupTime || 'Select pickup time'}
                    </Text>
                    {deliveryTime && (
                      <>
                        <Text style={asArrayTextStyle([styles.timeSelectionLabel, { color: colors.textSecondary, marginTop: 8 }])}>
                          Preferred Delivery
                        </Text>
                        <Text style={asArrayTextStyle([styles.timeSelectionValue, { color: colors.text }])}>
                          {deliveryTime}
                        </Text>
                      </>
                    )}
                  </View>
                  <View style={asArrayViewStyle([styles.timeSelectionArrow, { backgroundColor: colors.primary + '10' }])}>
                    <ChevronRight size={20} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

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
          </>
        )}
          </ScrollView>
      </KeyboardAvoidingView>
  
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
          orderDetails={currentOrder}
        />
      )}

      {/* Saved Addresses Modal */}
      <Modal
        visible={showAddressModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={asViewStyle(styles.modalOverlay)}>
          <View style={asViewStyle([styles.modalContainer, { backgroundColor: colors.background }])}>
            <Text style={asTextStyle([styles.modalTitle, { color: colors.text }])}>
              Select Address
            </Text>
            
            <ScrollView style={asViewStyle(styles.addressList)}>
              {savedAddresses.map((savedAddress) => (
                <TouchableOpacity
                  key={savedAddress.id}
                  style={asViewStyle([
                    styles.addressItem,
                    { 
                      backgroundColor: colors.card,
                      borderColor: savedAddress.isDefault ? colors.primary : colors.border,
                      borderWidth: savedAddress.isDefault ? 2 : 1
                    }
                  ])}
                  onPress={() => {
                    setAddress(savedAddress.address);
                    setShowAddressModal(false);
                  }}
                >
                  <View style={asViewStyle(styles.addressItemHeader)}>
                    <Text style={asTextStyle([styles.addressItemLabel, { color: colors.text }])}>
                      {savedAddress.label}
                    </Text>
                    {savedAddress.isDefault && (
                      <View style={asViewStyle([styles.defaultBadge, { backgroundColor: colors.primary }])}>
                        <Text style={asTextStyle(styles.defaultBadgeText)}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={asTextStyle([styles.addressItemText, { color: colors.textSecondary }])}>
                    {savedAddress.address}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={asViewStyle([styles.closeModalButton, { backgroundColor: colors.card }])}
              onPress={() => setShowAddressModal(false)}
            >
              <Text style={asTextStyle([styles.closeModalButtonText, { color: colors.text }])}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Selection Modal */}
      <TimeSelectionModal
        visible={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        onSave={async (selectedPickupTime?: string, selectedDeliveryTime?: string) => {
          if (selectedPickupTime) setPickupTime(selectedPickupTime);
          if (selectedDeliveryTime) setDeliveryTime(selectedDeliveryTime);
          setShowTimeModal(false);
        }}
        currentPickupTime={pickupTime}
        currentDeliveryTime={deliveryTime}
        orderStatus="pending"
      />

      {/* Scent Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showScentModal}
        onRequestClose={() => setShowScentModal(false)}
      >
        <View style={asViewStyle(styles.modalOverlay)}>
          <View style={[asViewStyle(styles.modalContent), { backgroundColor: colors.card }]}>
            <View style={asViewStyle(styles.modalHeader)}>
              <Text style={asArrayTextStyle([styles.modalTitle, { color: colors.text }])}>
                Choose Scent
              </Text>
              <TouchableOpacity 
                onPress={() => setShowScentModal(false)}
                style={asViewStyle(styles.modalCloseButton)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={asViewStyle(styles.scentList)}>
              {/* No Scent Option */}
              <TouchableOpacity
                style={[
                  asViewStyle(styles.scentOption),
                  { 
                    backgroundColor: selectedScent === 'none' ? colors.primary + '20' : 'transparent',
                    borderColor: selectedScent === 'none' ? colors.primary : colors.border
                  }
                ]}
                onPress={() => {
                  setSelectedScent('none');
                  setShowScentModal(false);
                }}
              >
                <View style={asViewStyle(styles.scentOptionContent)}>
                  <View style={asViewStyle(styles.scentOptionInfo)}>
                    <Text style={asArrayTextStyle([styles.scentOptionName, { color: colors.text }])}>
                      No Scent
                    </Text>
                    <Text style={asArrayTextStyle([styles.scentOptionDesc, { color: colors.textSecondary }])}>
                      Keep your items fragrance-free
                    </Text>
                  </View>
                  <Text style={asArrayTextStyle([styles.scentOptionPrice, { color: colors.primary }])}>
                    FREE
                  </Text>
                </View>
              </TouchableOpacity>
              {/* Scent Options */}
              {scentOptions.map((scent) => (
                <TouchableOpacity
                  key={scent.id}
                  style={[
                    asViewStyle(styles.scentOption),
                    { 
                      backgroundColor: selectedScent === scent.id ? colors.primary + '20' : 'transparent',
                      borderColor: selectedScent === scent.id ? colors.primary : colors.border
                    }
                  ]}
                  onPress={() => {
                    setSelectedScent(scent.id);
                    setShowScentModal(false);
                  }}
                >
                  <View style={asViewStyle(styles.scentOptionContent)}>
                    <View style={asViewStyle(styles.scentOptionInfo)}>
                      <Text style={asArrayTextStyle([styles.scentOptionName, { color: colors.text }])}>
                        {scent.name}
                      </Text>
                      <Text style={asArrayTextStyle([styles.scentOptionDesc, { color: colors.textSecondary }])}>
                        {scent.description}
                      </Text>
                    </View>
                    <Text style={asArrayTextStyle([styles.scentOptionPrice, { color: colors.primary }])}>
                      KSh {scent.price}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Address Details Modal */}
      <Modal visible={showAddressDetailsModal} animationType="fade" transparent onShow={() => console.log('[AddressDetails] Floating card shown')}> 
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={asViewStyle([{ flex:1, justifyContent:'flex-end' }])}>
          <View style={asViewStyle([{ flex:1, backgroundColor:'rgba(0,0,0,0.45)' }])}>
            <TouchableOpacity style={{ flex:1 }} activeOpacity={1} onPress={() => setShowAddressDetailsModal(false)} />
            <View style={asViewStyle([{ marginHorizontal:16, marginBottom:34, padding:20, borderRadius:24, backgroundColor: colors.card, borderWidth:1, borderColor: colors.border, shadowColor:'#000', shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 }])}>
              <View style={{ flexDirection:'row', alignItems:'center', marginBottom:14 }}>
                <TouchableOpacity onPress={() => setShowAddressDetailsModal(false)} style={{ padding:4, marginRight:8 }}>
                  <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ flex:1, textAlign:'center', fontSize:18, fontWeight:'700', color: colors.text }}>Address details</Text>
                <View style={{ width:22 }} />
              </View>
              <View style={{ flexDirection:'row', marginBottom:18 }}>
                <View style={{ width:44, height:44, borderRadius:14, backgroundColor: colors.primary + '22', alignItems:'center', justifyContent:'center', marginRight:12 }}>
                  <Ionicons name="bed-outline" size={22} color={colors.primary} />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:16, fontWeight:'600', color: colors.text, marginBottom:4 }} numberOfLines={2}>{address.split('\n')[0]}</Text>
                  <Text style={{ fontSize:13, color: colors.textSecondary }} numberOfLines={1}>{address.split(',').slice(1).join(',').trim()}</Text>
                </View>
              </View>
              <TextInput
                style={{ borderWidth:1, borderColor: colors.border, borderRadius:18, minHeight:100, padding:14, fontSize:14, color: colors.text, backgroundColor: colors.background, textAlignVertical:'top', marginBottom:16 }}
                placeholder="Additional information (apt, floor, gate code, landmark)"
                placeholderTextColor={colors.textSecondary}
                multiline
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                autoFocus
              />
              <View style={{ flexDirection:'row', gap:12 }}>
                <TouchableOpacity onPress={() => setShowAddressDetailsModal(false)} style={{ flex:1, height:46, borderRadius:16, backgroundColor: colors.card, borderWidth:1, borderColor: colors.border, alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ color: colors.textSecondary, fontWeight:'600' }}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowAddressDetailsModal(false)} style={{ flex:2, height:46, borderRadius:16, backgroundColor: colors.primary, alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ color:'#FFF', fontWeight:'700' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  checkoutSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
    marginTop: 10,
  },
  timeSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  textInputWrapper: {
    position: 'relative',
    marginBottom: 12,
    width: '100%',
  },
  inputValidationIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  additionalDetailsDisplay: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  additionalDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  additionalDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  editDetailsButton: {
    padding: 4,
  },
  additionalDetailsContent: {
    paddingLeft: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 8,
  },
  detailText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  addressInputContainer: {
    width: '100%',
    marginBottom: 16,
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
  sectionTitleContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  categoriesContainer: {
    paddingLeft: 20,
    paddingVertical: 12,
  },
  categoriesContent: {
    paddingRight: 20,
    gap: 18,
    paddingVertical: 8,
  },
  categoryCard: {
    position: 'relative',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 28,
    alignItems: 'center',
    minWidth: 160,
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    marginVertical: 6,
    marginHorizontal: 2,
  },
  categoryCardSelected: {
    shadowColor: Colors.light.primary,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
    transform: [{ translateY: -4 }, { scale: 1.02 }],
    borderColor: Colors.light.primary + '50',
    borderWidth: 3,
  },
  categoryGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  categoryIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    position: 'relative',
    overflow: 'hidden',
  },
  categoryIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 45,
  },
  categoryImage: {
    width: 68,
    height: 68,
    resizeMode: 'contain',
    zIndex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  categoryDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
    paddingHorizontal: 4,
    opacity: 0.9,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  categoryPopularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryPopularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  scentSelector: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 16,
  },
  scentSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scentInfo: {
    flex: 1,
  },
  scentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  scentSubtitle: {
    fontSize: 14,
  },
  scentPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scentPriceText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
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
    marginTop: 20,
    marginBottom: 20,
  },
  deliverySectionGradient: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  deliverySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  deliveryHeaderIcon: {
    marginRight: 16,
  },
  deliveryIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  deliveryHeaderText: {
    flex: 1,
  },
  deliverySectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  deliverySectionSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  deliveryCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addressModeToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.1)',
  },
  addressModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  addressModeButtonActive: {
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addressModeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  // Premium Input Card Styles
  premiumInputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.08)',
  },
  inputCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inputCardHeaderText: {
    flex: 1,
  },
  inputCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  inputCardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  characterCounter: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.7,
  },
  premiumTextInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    lineHeight: 20,
    minHeight: 90,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  validationIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  addDetailsButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveForLaterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  saveForLaterText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Phone Input Compact Styles
  phoneInputCompact: {
    padding: 16,
  },
  phoneInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  phoneInputHeaderTextCompact: {
    flex: 1,
  },
  premiumPhoneInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Full Width Layout Styles
  fullWidthLayout: {
    width: '100%',
  },
  premiumMapPickerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  mapPickerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapPickerIconLarge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mapPickerHeaderText: {
    flex: 1,
  },
  mapPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  mapPickerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  mapPickerChevron: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAddressPreview: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  selectedAddressText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  premiumTextInputLarge: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 120,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  premiumPhoneInputFull: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    fontSize: 16,
    fontWeight: '500',
  },
  addressActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  // Premium Address Display Styles
  deliveryAddressCard: {
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  deliveryAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryAddressIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deliveryAddressInfo: {
    flex: 1,
  },
  deliveryAddressLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  deliveryAddressText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  editAddressButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modalValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  modalTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563eb',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  // Scent Modal Styles
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scentList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  addressList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  addressItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  addressItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressItemLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  addressItemText: {
    fontSize: 14,
    lineHeight: 20,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  scentOption: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  scentOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scentOptionInfo: {
    flex: 1,
  },
  scentOptionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  scentOptionPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  timeSelectionContent: {
    flex: 1,
    marginLeft: 12,
  },
  timeSelectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  timeSelectionValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeSelectionArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scentOptionDesc: {
    fontSize: 14,
    opacity: 0.8,
  },
  closeModalButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  checkoutGradient: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});