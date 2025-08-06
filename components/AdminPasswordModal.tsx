import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { X, Lock } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface AdminPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (password === '12110') {
      onSuccess();
      setPassword('');
      onClose();
    } else {
      Alert.alert('Access Denied', 'Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Card style={{ ...styles.modal, backgroundColor: colors.card }}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Lock size={24} color={colors.primary} />
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Admin Access Required
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the admin password to access analytics
          </Text>

          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
            style={styles.input}
          />

          <View style={styles.buttons}>
            <Button
              title="Cancel"
              onPress={handleClose}
              variant="outline"
              style={styles.cancelButton}
            />
            <Button
              title="Access"
              onPress={handleSubmit}
              style={styles.accessButton}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  accessButton: {
    flex: 1,
  },
});