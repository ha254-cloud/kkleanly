import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface State {
  hasError: boolean;
  error?: Error;
  info?: { componentStack: string };
}

export class GlobalErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[GlobalErrorBoundary] Caught error:', error?.message, error?.stack);
    console.error('[GlobalErrorBoundary] Component stack:', info?.componentStack);
    this.setState({ info });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, info: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{this.state.error?.message}</Text>
        <ScrollView style={styles.stackBox}>
          <Text style={styles.stack}>{this.state.error?.stack}</Text>
          {this.state.info?.componentStack && (
            <Text style={styles.componentStack}>{this.state.info.componentStack}</Text>
          )}
        </ScrollView>
        <TouchableOpacity style={styles.button} onPress={this.handleReset}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#111', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 12 },
  message: { color: '#f87171', marginBottom: 16 },
  stackBox: { maxHeight: 300, marginBottom: 20, backgroundColor: '#222', padding: 12, borderRadius: 8 },
  stack: { fontSize: 12, color: '#ddd' },
  componentStack: { fontSize: 12, color: '#9ca3af', marginTop: 16 },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});

export default GlobalErrorBoundary;
