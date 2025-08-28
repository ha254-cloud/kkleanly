import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DriverIndexBackup() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Driver Index Backup</Text>
      <Text style={styles.subtitle}>This is a backup driver interface</Text>
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