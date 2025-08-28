import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LocationDemo() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Location Demo</Text>
      <Text style={styles.subtitle}>Location services demonstration</Text>
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