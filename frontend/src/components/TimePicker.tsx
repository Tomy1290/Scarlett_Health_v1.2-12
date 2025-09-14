import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TimePickerProps {
  time: Date;
  onTimeChange: (time: Date) => void;
  label?: string;
  colors: {
    text: string;
    primary: string;
    card: string;
    muted: string;
  };
  style?: any;
}

export function TimePicker({ time, onTimeChange, label, colors, style }: TimePickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [timeInput, setTimeInput] = useState('');

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handleTimeUpdate = () => {
    // Parse the input (e.g., "14:30" or "1430" or "14.30")
    const normalized = timeInput.replace(/[^\d]/g, ''); // Remove non-digits
    
    if (normalized.length === 4) {
      const hour = parseInt(normalized.substring(0, 2), 10);
      const minute = parseInt(normalized.substring(2, 4), 10);
      
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        const newTime = new Date();
        newTime.setHours(hour, minute, 0, 0);
        onTimeChange(newTime);
        setShowModal(false);
        setTimeInput('');
        return;
      }
    } else if (normalized.length === 3) {
      const hour = parseInt(normalized.substring(0, 1), 10);
      const minute = parseInt(normalized.substring(1, 3), 10);
      
      if (hour >= 0 && hour <= 9 && minute >= 0 && minute <= 59) {
        const newTime = new Date();
        newTime.setHours(hour, minute, 0, 0);
        onTimeChange(newTime);
        setShowModal(false);
        setTimeInput('');
        return;
      }
    }
    
    // If parsing fails, just close modal
    setShowModal(false);
    setTimeInput('');
  };

  const openModal = () => {
    setTimeInput(formatTime(time).replace(':', ''));
    setShowModal(true);
  };

  return (
    <View style={style}>
      {label && (
        <Text style={{ color: colors.text, fontSize: 16, marginBottom: 8 }}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        onPress={openModal}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.card,
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.primary + '40',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <Text style={{ 
            color: colors.text, 
            fontSize: 16, 
            marginLeft: 8,
            fontWeight: '500'
          }}>
            {formatTime(time)}
          </Text>
        </View>
        
        <Ionicons name="chevron-down" size={20} color={colors.muted} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: colors.card,
            padding: 20,
            borderRadius: 12,
            width: 280,
          }}>
            <Text style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              Zeit eingeben
            </Text>
            
            <TextInput
              value={timeInput}
              onChangeText={setTimeInput}
              placeholder="z.B. 1430 oder 14:30"
              placeholderTextColor={colors.muted}
              style={{
                backgroundColor: colors.card,
                borderWidth: 2,
                borderColor: colors.primary,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: colors.text,
                textAlign: 'center',
                marginBottom: 16
              }}
              keyboardType="numeric"
              maxLength={5}
            />
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.muted,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: colors.text }}>Abbrechen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleTimeUpdate}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}