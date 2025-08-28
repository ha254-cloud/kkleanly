import React, { useState } from 'react';
import { View, Text, TextInput, Alert, ScrollView, TouchableOpacity } from 'react-native';
import AutoDriverService from '../services/autoDriverService';

interface NewDriverData {
  email: string;
  password: string;
  name: string;
  phone: string;
  vehicleType: string;
  plateNumber: string;
  vehicleModel: string;
}

export const AdminDriverCreation = () => {
  const [newDriver, setNewDriver] = useState<NewDriverData>({
    email: '',
    password: '',
    name: '',
    phone: '',
    vehicleType: 'motorcycle',
    plateNumber: '',
    vehicleModel: ''
  });
  
  const [isCreating, setIsCreating] = useState(false);

  const generateRandomPassword = () => {
    const password = AutoDriverService.generateSecurePassword();
    setNewDriver(prev => ({ ...prev, password }));
  };

  const createDriver = async () => {
    try {
      setIsCreating(true);
      
      // Validate inputs
      if (!newDriver.email || !newDriver.password || !newDriver.name) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      console.log('Creating driver account with auto-authentication...');
      
      // Use AutoDriverService for complete driver creation
      const result = await AutoDriverService.createDriverWithAutoAuth({
        email: newDriver.email,
        password: newDriver.password,
        name: newDriver.name,
        phone: newDriver.phone,
        vehicle: {
          type: newDriver.vehicleType,
          plateNumber: newDriver.plateNumber,
          model: newDriver.vehicleModel
        }
      });

      if (result.success) {
        Alert.alert(
          'Success!', 
          `${result.message}\n\n📧 Email: ${newDriver.email}\n🔑 Password: ${newDriver.password}\n\n✅ Driver can now log in and access driver dashboard immediately!`,
          [{ text: 'OK' }]
        );

        // Reset form
        setNewDriver({
          email: '',
          password: '',
          name: '',
          phone: '',
          vehicleType: 'motorcycle',
          plateNumber: '',
          vehicleModel: ''
        });
      } else {
        Alert.alert('Error', result.message);
      }

    } catch (error: any) {
      console.error('Error creating driver:', error);
      Alert.alert('Error', error.message || 'Failed to create driver');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollView className="flex-1 p-4 bg-white">
      <Text className="text-2xl font-bold mb-6 text-center">Add New Driver</Text>
      
      <View className="space-y-4">
        {/* Email */}
        <View>
          <Text className="text-sm font-medium mb-2">Email *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="kleanlyspt@gmail.com"
            value={newDriver.email}
            onChangeText={(text) => setNewDriver(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View>
          <Text className="text-sm font-medium mb-2">Password *</Text>
          <View className="flex-row">
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg p-3 mr-2"
              placeholder="Password"
              value={newDriver.password}
              onChangeText={(text) => setNewDriver(prev => ({ ...prev, password: text }))}
              secureTextEntry
            />
            <TouchableOpacity
              onPress={generateRandomPassword}
              className="bg-blue-500 px-4 py-3 rounded-lg justify-center"
            >
              <Text className="text-white text-xs">Generate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Name */}
        <View>
          <Text className="text-sm font-medium mb-2">Full Name *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="John Doe"
            value={newDriver.name}
            onChangeText={(text) => setNewDriver(prev => ({ ...prev, name: text }))}
          />
        </View>

        {/* Phone */}
        <View>
          <Text className="text-sm font-medium mb-2">Phone Number</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="+254712345678"
            value={newDriver.phone}
            onChangeText={(text) => setNewDriver(prev => ({ ...prev, phone: text }))}
            keyboardType="phone-pad"
          />
        </View>

        {/* Vehicle Type */}
        <View>
          <Text className="text-sm font-medium mb-2">Vehicle Type</Text>
          <View className="flex-row space-x-2">
            {['motorcycle', 'car', 'van', 'truck'].map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setNewDriver(prev => ({ ...prev, vehicleType: type }))}
                className={`px-4 py-2 rounded-lg border ${
                  newDriver.vehicleType === type 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text className={`capitalize ${
                  newDriver.vehicleType === type ? 'text-white' : 'text-gray-700'
                }`}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Plate Number */}
        <View>
          <Text className="text-sm font-medium mb-2">Plate Number</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="KBA 123A"
            value={newDriver.plateNumber}
            onChangeText={(text) => setNewDriver(prev => ({ ...prev, plateNumber: text.toUpperCase() }))}
            autoCapitalize="characters"
          />
        </View>

        {/* Vehicle Model */}
        <View>
          <Text className="text-sm font-medium mb-2">Vehicle Model</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="Honda CB 150"
            value={newDriver.vehicleModel}
            onChangeText={(text) => setNewDriver(prev => ({ ...prev, vehicleModel: text }))}
          />
        </View>

        {/* Create Button */}
        <TouchableOpacity
          onPress={createDriver}
          disabled={isCreating}
          className={`py-4 rounded-lg mt-6 ${
            isCreating ? 'bg-gray-400' : 'bg-green-500'
          }`}
        >
          <Text className="text-white text-center font-bold text-lg">
            {isCreating ? 'Creating Driver...' : '🚀 Create Driver Account'}
          </Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View className="bg-yellow-50 p-4 rounded-lg mt-4">
          <Text className="text-sm text-yellow-800 font-medium">⚠️ Important:</Text>
          <Text className="text-sm text-yellow-700 mt-1">
            After creating a driver, you must add their email to the KNOWN_DRIVER_EMAILS array in utils/adminAuth.ts for the app to recognize them as drivers.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};
