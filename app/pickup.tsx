import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Pickup() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Pickup</Text>
      <Text style={styles.subtitle}>Pickup management interface</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});